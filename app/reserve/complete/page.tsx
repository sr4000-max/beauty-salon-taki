import Link from "next/link";
import { headers } from "next/headers";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { prisma } from "@/lib/prisma";
import {
  buildGoogleCalendarUrl,
  buildReservationCalendarEvent,
} from "@/lib/calendar";
import {
  formatJpDateLong,
  getJstHour,
  getJstMinute,
  minToTimeStr,
} from "@/lib/time";

export const metadata = { title: "予約完了｜Beauty Salon TAKI" };

async function loadReservation(token: string | undefined) {
  if (!token) return null;
  return prisma.reservation.findUnique({
    where: { cancelToken: token },
    include: {
      menu: true,
      staff: true,
      extras: { include: { menu: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}

async function buildBaseUrl(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export default async function CompletePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const reservation = await loadReservation(sp.token);

  let googleCalendarUrl: string | null = null;
  let timeLabel: string | null = null;
  let menuNames: string[] = [];

  if (reservation) {
    const store = await prisma.store.findFirst();
    const baseUrl = await buildBaseUrl();
    const orderedMenus = [
      reservation.menu,
      ...reservation.extras.map((e) => e.menu),
    ];
    menuNames = orderedMenus.map((m) => m.name);
    const event = buildReservationCalendarEvent({
      reservationId: reservation.id,
      storeName: store?.name ?? "サロン",
      storeAddress: store?.address ?? null,
      storePhone: store?.phone ?? null,
      menuNames,
      startAt: reservation.startAt,
      endAt: reservation.endAt,
      cancelUrl: reservation.cancelToken
        ? `${baseUrl}/cancel/${reservation.cancelToken}`
        : null,
    });
    googleCalendarUrl = buildGoogleCalendarUrl(event);
    const startMin =
      getJstHour(reservation.startAt) * 60 +
      getJstMinute(reservation.startAt);
    const endMin =
      getJstHour(reservation.endAt) * 60 + getJstMinute(reservation.endAt);
    timeLabel = `${formatJpDateLong(reservation.startAt)} ${minToTimeStr(startMin)}〜${minToTimeStr(endMin)}`;
  }

  return (
    <>
      <SiteHeader active="reservation" />

      <section className="page-head">
        <div className="page-head-inner">
          <p className="section-en">Thank You</p>
          <h1 className="page-title">ご予約ありがとうございます</h1>
        </div>
      </section>

      <section className="section">
        <div className="container container-narrow text-center">
          <div className="bg-white border border-[var(--color-line)] rounded-sm p-10">
            <div
              className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center text-3xl text-white"
              style={{ background: "var(--color-accent)" }}
            >
              ✓
            </div>
            <p className="font-[var(--font-jp-serif)] text-lg mb-3">
              ご予約を承りました
            </p>
            <p className="text-sm text-[color:var(--color-text-light)] mb-2">
              ご登録いただいたメールアドレス宛に、予約確認メールをお送りしました。
            </p>

            {reservation && timeLabel && (
              <div className="my-6 p-4 bg-[color:var(--color-bg-alt)] rounded-sm text-left">
                <p className="text-xs text-[color:var(--color-text-light)] mb-1">
                  ご予約日時
                </p>
                <p className="font-[var(--font-jp-serif)] text-base">
                  {timeLabel}
                </p>
                {menuNames.length > 0 && (
                  <p className="text-sm text-[color:var(--color-text-light)] mt-1">
                    {menuNames.join(" / ")}
                  </p>
                )}
              </div>
            )}

            {googleCalendarUrl && (
              <div className="mb-6">
                <p className="text-sm text-[color:var(--color-text-light)] mb-3">
                  カレンダーに追加してお忘れ防止に
                </p>
                <a
                  href={googleCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-block"
                >
                  📅 Google カレンダーに追加
                </a>
                <p className="text-xs text-[color:var(--color-text-light)] mt-3">
                  iOS / Outlook 等をご利用の方はメール添付の .ics ファイルから追加できます。
                </p>
              </div>
            )}

            <p className="text-sm text-[color:var(--color-text-light)] mb-8">
              当日のご来店をお待ちしております。
            </p>
            <Link href="/" className="btn-primary">
              トップへ戻る
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
