"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { isSlotStillFree, parseMenuIds } from "@/lib/availability";
import { combineDateAndMin } from "@/lib/time";
import { sendReservationEmails, sendCancellationEmails } from "@/lib/mailer";
import {
  buildGoogleCalendarUrl,
  buildIcsContent,
  buildReservationCalendarEvent,
} from "@/lib/calendar";

const PENDING_COOKIE = "pending_reservation";

function generateCancelToken(): string {
  return randomBytes(16).toString("hex");
}

async function buildBaseUrl(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

const pendingSchema = z.object({
  menuIds: z.array(z.number().int().positive()).min(1),
  staffId: z.number().int().positive().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startMin: z.number().int().min(0).max(24 * 60),
  customerName: z.string().min(1).max(50),
  customerKana: z.string().max(50).optional().nullable(),
  customerPhone: z.string().min(1).max(40),
  customerEmail: z.string().email(),
  notes: z.string().max(500).optional().nullable(),
});

export type PendingReservation = z.infer<typeof pendingSchema>;

export async function setPendingReservation(p: PendingReservation) {
  const c = await cookies();
  c.set(PENDING_COOKIE, JSON.stringify(p), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 30,
  });
}

export async function getPendingReservation(): Promise<PendingReservation | null> {
  const c = await cookies();
  const v = c.get(PENDING_COOKIE)?.value;
  if (!v) return null;
  try {
    return pendingSchema.parse(JSON.parse(v));
  } catch {
    return null;
  }
}

export async function clearPendingReservation() {
  const c = await cookies();
  c.delete(PENDING_COOKIE);
}

const formSchema = z.object({
  menuIds: z.string(),
  staffId: z
    .union([z.coerce.number().int().positive(), z.literal(""), z.literal("any")])
    .transform((v) => (v === "" || v === "any" ? null : Number(v))),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startMin: z.coerce.number().int().min(0).max(24 * 60),
  customerName: z.string().min(1).max(50),
  customerKana: z.string().max(50).optional().or(z.literal("")),
  customerPhone: z.string().min(1).max(40),
  customerEmail: z.string().email("正しいメールアドレスを入力してください"),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export async function savePendingFromFormAction(formData: FormData) {
  const parsed = formSchema.parse({
    menuIds: formData.get("menuIds") ?? "",
    staffId: formData.get("staffId") ?? "",
    date: formData.get("date"),
    startMin: formData.get("startMin"),
    customerName: formData.get("customerName"),
    customerKana: formData.get("customerKana") ?? "",
    customerPhone: formData.get("customerPhone"),
    customerEmail: formData.get("customerEmail") ?? "",
    notes: formData.get("notes") ?? "",
  });

  const menuIds = parseMenuIds(parsed.menuIds);
  if (menuIds.length === 0) redirect("/menus");

  await setPendingReservation({
    menuIds,
    staffId: parsed.staffId,
    date: parsed.date,
    startMin: parsed.startMin,
    customerName: parsed.customerName,
    customerKana: parsed.customerKana || null,
    customerPhone: parsed.customerPhone,
    customerEmail: parsed.customerEmail,
    notes: parsed.notes || null,
  });

  const primary = menuIds[0];
  const addons = menuIds.slice(1);
  const addonQuery = addons.length ? `?addons=${addons.join(",")}` : "";
  redirect(`/reserve/${primary}/confirm${addonQuery}`);
}

export async function confirmReservationAction() {
  const pending = await getPendingReservation();
  if (!pending) {
    redirect("/menus");
  }
  const menus = await prisma.menu.findMany({
    where: { id: { in: pending.menuIds } },
  });
  if (menus.length !== pending.menuIds.length) redirect("/menus");

  const orderedMenus = pending.menuIds
    .map((id) => menus.find((m) => m.id === id))
    .filter((m): m is (typeof menus)[number] => !!m);

  const totalDuration = orderedMenus.reduce((s, m) => s + m.durationMinutes, 0);
  const totalPrice = orderedMenus.reduce((s, m) => s + m.priceYen, 0);

  const startAt = combineDateAndMin(pending.date, pending.startMin);
  const endAt = new Date(startAt.getTime() + totalDuration * 60 * 1000);

  const slot = await isSlotStillFree({
    startAt,
    endAt,
    staffId: pending.staffId,
    menuIds: pending.menuIds,
  });

  if (!slot.ok) {
    return { error: slot.reason };
  }

  const primary = orderedMenus[0];
  const extras = orderedMenus.slice(1);
  const cancelToken = generateCancelToken();

  const created = await prisma.reservation.create({
    data: {
      customerName: pending.customerName,
      customerKana: pending.customerKana,
      customerPhone: pending.customerPhone,
      customerEmail: pending.customerEmail,
      notes: pending.notes,
      menuId: primary.id,
      staffId: slot.staffId,
      startAt,
      endAt,
      source: "WEB",
      status: "BOOKED",
      cancelToken,
      extras: {
        create: extras.map((m, i) => ({
          menuId: m.id,
          sortOrder: i,
        })),
      },
    },
  });

  const [store, staff, baseUrl] = await Promise.all([
    prisma.store.findFirst(),
    prisma.staff.findUnique({ where: { id: slot.staffId } }),
    buildBaseUrl(),
  ]);

  const calendarEvent = buildReservationCalendarEvent({
    reservationId: created.id,
    storeName: store?.name ?? "サロン",
    storeAddress: store?.address ?? null,
    storePhone: store?.phone ?? null,
    menuNames: orderedMenus.map((m) => m.name),
    startAt,
    endAt,
    cancelUrl: `${baseUrl}/cancel/${cancelToken}`,
  });

  await sendReservationEmails({
    customerName: pending.customerName,
    customerEmail: pending.customerEmail,
    adminEmail: store?.adminEmail ?? null,
    storeName: store?.name ?? "サロン",
    storePhone: store?.phone ?? null,
    menus: orderedMenus.map((m) => ({
      name: m.name,
      priceYen: m.priceYen,
      durationMinutes: m.durationMinutes,
    })),
    totalPrice,
    totalDuration,
    staffName: staff?.name ?? null,
    startAt,
    endAt,
    notes: pending.notes ?? null,
    cancelUrl: `${baseUrl}/cancel/${cancelToken}`,
    googleCalendarUrl: buildGoogleCalendarUrl(calendarEvent),
    icsContent: buildIcsContent(calendarEvent),
  });

  await clearPendingReservation();
  revalidatePath("/admin");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/reservations");
  redirect(`/reserve/complete?token=${cancelToken}`);
}

const adminCreateSchema = z.object({
  menuId: z.coerce.number().int().positive(),
  extraMenuIds: z.string().optional(),
  staffId: z.coerce.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  customerName: z.string().min(1).max(50),
  customerPhone: z.string().min(1).max(40),
  customerKana: z.string().max(50).optional().or(z.literal("")),
  customerEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  force: z
    .union([z.literal("on"), z.literal(""), z.null(), z.undefined()])
    .transform((v) => v === "on"),
});

export async function createAdminReservationAction(formData: FormData) {
  await requireAdmin();
  const extraIdsRaw = formData.getAll("extraMenuIds").map(String).join(",");
  const parsed = adminCreateSchema.parse({
    menuId: formData.get("menuId"),
    extraMenuIds: extraIdsRaw,
    staffId: formData.get("staffId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    customerKana: formData.get("customerKana") ?? "",
    customerEmail: formData.get("customerEmail") ?? "",
    notes: formData.get("notes") ?? "",
    force: formData.get("force"),
  });

  const extraIds = parseMenuIds(parsed.extraMenuIds).filter(
    (id) => id !== parsed.menuId,
  );
  const menuIds = [parsed.menuId, ...extraIds];
  const menus = await prisma.menu.findMany({
    where: { id: { in: menuIds } },
  });
  if (menus.length !== menuIds.length) {
    return { error: "メニューの一部が見つかりません" };
  }
  const orderedMenus = menuIds
    .map((id) => menus.find((m) => m.id === id))
    .filter((m): m is (typeof menus)[number] => !!m);
  const totalDuration = orderedMenus.reduce(
    (s, m) => s + m.durationMinutes,
    0,
  );
  const totalPrice = orderedMenus.reduce((s, m) => s + m.priceYen, 0);

  const [h, m] = parsed.startTime.split(":").map(Number);
  const startAt = combineDateAndMin(parsed.date, h * 60 + m);
  const endAt = new Date(startAt.getTime() + totalDuration * 60 * 1000);

  if (!parsed.force) {
    const conflict = await prisma.reservation.findFirst({
      where: {
        status: "BOOKED",
        staffId: parsed.staffId,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });
    if (conflict) {
      return {
        error:
          "指定時間にこのスタッフの予約があります。強制登録する場合は「強制登録」にチェックしてください。",
      };
    }
  }

  const cancelToken = parsed.customerEmail ? generateCancelToken() : null;

  const created = await prisma.reservation.create({
    data: {
      customerName: parsed.customerName,
      customerKana: parsed.customerKana || null,
      customerPhone: parsed.customerPhone,
      customerEmail: parsed.customerEmail || null,
      notes: parsed.notes || null,
      menuId: parsed.menuId,
      staffId: parsed.staffId,
      startAt,
      endAt,
      source: "ADMIN",
      status: "BOOKED",
      cancelToken,
      extras: {
        create: extraIds.map((id, i) => ({ menuId: id, sortOrder: i })),
      },
    },
  });

  const [store, staff, baseUrl] = await Promise.all([
    prisma.store.findFirst(),
    prisma.staff.findUnique({ where: { id: parsed.staffId } }),
    buildBaseUrl(),
  ]);

  const calendarEvent = buildReservationCalendarEvent({
    reservationId: created.id,
    storeName: store?.name ?? "サロン",
    storeAddress: store?.address ?? null,
    storePhone: store?.phone ?? null,
    menuNames: orderedMenus.map((m) => m.name),
    startAt,
    endAt,
    cancelUrl: cancelToken ? `${baseUrl}/cancel/${cancelToken}` : null,
  });

  await sendReservationEmails({
    customerName: parsed.customerName,
    customerEmail: parsed.customerEmail || null,
    adminEmail: store?.adminEmail ?? null,
    storeName: store?.name ?? "サロン",
    storePhone: store?.phone ?? null,
    menus: orderedMenus.map((m) => ({
      name: m.name,
      priceYen: m.priceYen,
      durationMinutes: m.durationMinutes,
    })),
    totalPrice,
    totalDuration,
    staffName: staff?.name ?? null,
    startAt,
    endAt,
    googleCalendarUrl: parsed.customerEmail
      ? buildGoogleCalendarUrl(calendarEvent)
      : null,
    icsContent: parsed.customerEmail ? buildIcsContent(calendarEvent) : null,
    notes: parsed.notes || null,
    cancelUrl: cancelToken ? `${baseUrl}/cancel/${cancelToken}` : null,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/reservations");
  redirect("/admin/reservations");
}

export async function updateReservationStatusAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["BOOKED", "COMPLETED", "CANCELLED"].includes(status)) return;
  await prisma.reservation.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/reservations");
  revalidatePath(`/admin/reservations/${id}`);
}

export async function cancelByTokenAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "キャンセル用のリンクが無効です" };

  const r = await prisma.reservation.findUnique({
    where: { cancelToken: token },
    include: {
      menu: true,
      staff: true,
      extras: { include: { menu: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!r) return { error: "予約が見つかりません" };
  if (r.status === "CANCELLED") return { error: "この予約は既にキャンセル済みです" };
  if (r.startAt < new Date())
    return { error: "予約時刻を過ぎているためキャンセルできません" };

  await prisma.reservation.update({
    where: { id: r.id },
    data: { status: "CANCELLED" },
  });

  const allMenus = [r.menu, ...r.extras.map((e) => e.menu)];
  const totalPrice = allMenus.reduce((s, m) => s + m.priceYen, 0);
  const totalDuration = allMenus.reduce((s, m) => s + m.durationMinutes, 0);

  const store = await prisma.store.findFirst();
  await sendCancellationEmails({
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    adminEmail: store?.adminEmail ?? null,
    storeName: store?.name ?? "サロン",
    storePhone: store?.phone ?? null,
    menus: allMenus.map((m) => ({
      name: m.name,
      priceYen: m.priceYen,
      durationMinutes: m.durationMinutes,
    })),
    totalPrice,
    totalDuration,
    staffName: r.staff?.name ?? null,
    startAt: r.startAt,
    endAt: r.endAt,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/reservations");
  return { success: true };
}
