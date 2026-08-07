/**
 * Cron 用エンドポイント。Vercel Cron / GitHub Actions / cron-job.org 等から
 * 5 分間隔程度で叩かれることを想定している。
 *
 * 認証: Authorization: Bearer ${CRON_SECRET}
 *
 * 処理:
 *   1. 23〜25時間後に開始する予約 → 1日前リマインダー送信 (窓 2時間)
 *   2. 20〜40分後に開始する予約 → 30分前リマインダー送信 (窓 20分)
 *   いずれも reminder*SentAt が null のものだけが対象 (多重送信防止)。
 *
 * 窓を広めに取っている理由: GitHub Actions の 5分 cron はまれに
 * "job was not acquired by Runner" のような一時障害でスキップされることが
 * ある。20分窓なら 5分cron 4回のうち1回でも成功すれば取りこぼしゼロ。
 */
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail, type ReminderKind } from "@/lib/mailer";
import {
  buildGoogleCalendarUrl,
  buildReservationCalendarEvent,
} from "@/lib/calendar";

export const runtime = "nodejs";
// Cron は静的な return ではなく現時刻に依存するので毎回動的実行する
export const dynamic = "force-dynamic";

function buildBaseUrl(req: NextRequest): string {
  const host = req.headers.get("host") ?? "localhost:3000";
  const proto =
    req.headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function authenticate(req: NextRequest): Promise<boolean> {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error("[cron] CRON_SECRET is not set");
    return false;
  }
  const auth = req.headers.get("authorization");
  if (!auth) return false;
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  return token === expected;
}

type ReminderRow = Awaited<ReturnType<typeof fetchReminderTargets>>[number];

async function fetchReminderTargets(
  kind: ReminderKind,
  windowStart: Date,
  windowEnd: Date,
) {
  const reminderField =
    kind === "DAY_BEFORE"
      ? "reminderDayBeforeSentAt"
      : "reminderShortBeforeSentAt";

  return prisma.reservation.findMany({
    where: {
      status: "BOOKED",
      startAt: { gte: windowStart, lt: windowEnd },
      customerEmail: { not: null },
      [reminderField]: null,
    },
    include: {
      menu: true,
      staff: true,
      extras: { include: { menu: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}

async function sendOne(
  baseUrl: string,
  storeInfo: {
    storeName: string;
    storeAddress: string | null;
    storePhone: string | null;
  },
  r: ReminderRow,
  kind: ReminderKind,
) {
  if (!r.customerEmail) return;
  const orderedMenus = [r.menu, ...r.extras.map((e) => e.menu)];
  const totalPrice = orderedMenus.reduce((s, m) => s + m.priceYen, 0);
  const totalDuration = orderedMenus.reduce(
    (s, m) => s + m.durationMinutes,
    0,
  );

  const cancelUrl = r.cancelToken
    ? `${baseUrl}/cancel/${r.cancelToken}`
    : null;

  const calendarEvent = buildReservationCalendarEvent({
    reservationId: r.id,
    storeName: storeInfo.storeName,
    storeAddress: storeInfo.storeAddress,
    storePhone: storeInfo.storePhone,
    menuNames: orderedMenus.map((m) => m.name),
    startAt: r.startAt,
    endAt: r.endAt,
    cancelUrl,
  });

  await sendReminderEmail({
    kind,
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    storeName: storeInfo.storeName,
    storePhone: storeInfo.storePhone,
    menus: orderedMenus.map((m) => ({
      name: m.name,
      priceYen: m.priceYen,
      durationMinutes: m.durationMinutes,
    })),
    totalPrice,
    totalDuration,
    staffName: r.staff?.name ?? null,
    startAt: r.startAt,
    endAt: r.endAt,
    cancelUrl,
    googleCalendarUrl: buildGoogleCalendarUrl(calendarEvent),
  });

  const updateField =
    kind === "DAY_BEFORE"
      ? { reminderDayBeforeSentAt: new Date() }
      : { reminderShortBeforeSentAt: new Date() };
  await prisma.reservation.update({
    where: { id: r.id },
    data: updateField,
  });
}

export async function GET(req: NextRequest) {
  if (!(await authenticate(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // 1日前リマインダー: 23時間後 〜 25時間後 (2時間ウィンドウ)
  const dayBeforeStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const dayBeforeEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);
  // 30分前リマインダー: 20分後 〜 40分後 (20分ウィンドウ — GitHub Actions が
  // 何回か連続で失敗しても取り逃がさないよう広めに取る。メール件名は
  // 「まもなくご予約のお時間です」なので 20〜40分前ならまだ自然な文言)
  const shortBeforeStart = new Date(now.getTime() + 20 * 60 * 1000);
  const shortBeforeEnd = new Date(now.getTime() + 40 * 60 * 1000);

  const baseUrl = buildBaseUrl(req);
  const store = await prisma.store.findFirst();
  const storeInfo = {
    storeName: store?.name ?? "サロン",
    storeAddress: store?.address ?? null,
    storePhone: store?.phone ?? null,
  };

  const [dayBeforeTargets, shortBeforeTargets] = await Promise.all([
    fetchReminderTargets("DAY_BEFORE", dayBeforeStart, dayBeforeEnd),
    fetchReminderTargets("SHORT_BEFORE", shortBeforeStart, shortBeforeEnd),
  ]);

  const results = {
    sent: { dayBefore: 0, shortBefore: 0 },
    errors: [] as string[],
    runAt: now.toISOString(),
  };

  for (const r of dayBeforeTargets) {
    try {
      await sendOne(baseUrl, storeInfo, r, "DAY_BEFORE");
      results.sent.dayBefore++;
    } catch (e) {
      console.error("[cron] DAY_BEFORE error", r.id, e);
      results.errors.push(`day-before #${r.id}: ${(e as Error).message}`);
    }
  }
  for (const r of shortBeforeTargets) {
    try {
      await sendOne(baseUrl, storeInfo, r, "SHORT_BEFORE");
      results.sent.shortBefore++;
    } catch (e) {
      console.error("[cron] SHORT_BEFORE error", r.id, e);
      results.errors.push(`short-before #${r.id}: ${(e as Error).message}`);
    }
  }

  console.log("[cron:reminders]", results);
  return NextResponse.json(results);
}
