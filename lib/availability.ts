import { prisma } from "./prisma";
import { addDays, combineDateAndMin, dateToYmd, ymdToDate } from "./time";

export type SlotStatus = "available" | "full" | "closed" | "past";

export type Slot = {
  startMin: number;
  status: SlotStatus;
  freeStaffIds: number[];
};

export type AvailabilityResult = {
  date: string;
  isClosed: boolean;
  slots: Slot[];
};

export const ADVANCE_BOOKING_MIN = 150;

export function staffWorksOn(workDays: string, dayOfWeek: number): boolean {
  return workDays
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(String(dayOfWeek));
}

export async function isHoliday(ymd: string): Promise<boolean> {
  const d = ymdToDate(ymd);
  const found = await prisma.holiday.findUnique({ where: { date: d } });
  return !!found;
}

export function parseMenuIds(input: string | string[] | undefined | null): number[] {
  if (!input) return [];
  const raw = Array.isArray(input) ? input.join(",") : input;
  return raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
}

/**
 * Bulk version of computeAvailability for a contiguous date range.
 * Performs O(1) DB round-trips (independent of numDays) so the slot grid is fast.
 */
export async function computeAvailabilityRange(opts: {
  startDate: string;
  numDays: number;
  menuIds: number[];
  staffId?: number | null;
  storeId?: number;
}): Promise<AvailabilityResult[]> {
  const { startDate, numDays, menuIds, staffId } = opts;
  const dates: string[] = [];
  const startObj = ymdToDate(startDate);
  for (let i = 0; i < numDays; i++) {
    dates.push(dateToYmd(addDays(startObj, i)));
  }

  const rangeStart = ymdToDate(dates[0]);
  const rangeEnd = addDays(ymdToDate(dates[dates.length - 1]), 1);

  const [store, menus, allStaff, holidays, reservations, blocks] =
    await Promise.all([
      opts.storeId
        ? prisma.store.findUnique({
            where: { id: opts.storeId },
            include: { businessHours: true },
          })
        : prisma.store.findFirst({ include: { businessHours: true } }),
      menuIds.length
        ? prisma.menu.findMany({
            where: { id: { in: menuIds }, active: true },
          })
        : Promise.resolve([]),
      prisma.staff.findMany({
        where: {
          active: true,
          ...(staffId ? { id: staffId } : {}),
        },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.holiday.findMany({
        where: { date: { gte: rangeStart, lt: rangeEnd } },
      }),
      prisma.reservation.findMany({
        where: {
          status: "BOOKED",
          startAt: { lt: rangeEnd },
          endAt: { gt: rangeStart },
        },
        select: { staffId: true, startAt: true, endAt: true },
      }),
      prisma.block.findMany({
        where: { date: { gte: rangeStart, lt: rangeEnd } },
        select: {
          date: true,
          staffId: true,
          startMin: true,
          endMin: true,
        },
      }),
    ]);

  if (!store || menus.length !== menuIds.length || menuIds.length === 0) {
    return dates.map((date) => ({ date, isClosed: true, slots: [] }));
  }

  const duration = menus.reduce((s, m) => s + m.durationMinutes, 0);
  const slotMin = store.slotMinutes;
  const earliestAllowed = new Date(
    Date.now() + ADVANCE_BOOKING_MIN * 60 * 1000,
  );

  const holidayKeys = new Set(holidays.map((h) => dateToYmd(h.date)));
  const blocksByDate = new Map<
    string,
    { staffId: number | null; startMin: number; endMin: number }[]
  >();
  for (const b of blocks) {
    const key = dateToYmd(b.date);
    const arr = blocksByDate.get(key) ?? [];
    arr.push({ staffId: b.staffId, startMin: b.startMin, endMin: b.endMin });
    blocksByDate.set(key, arr);
  }

  return dates.map((date) => {
    const dateObj = ymdToDate(date);
    const dayOfWeek = dateObj.getDay();
    const bh = store.businessHours.find((b) => b.dayOfWeek === dayOfWeek);
    if (holidayKeys.has(date) || !bh || bh.isClosed) {
      return { date, isClosed: true, slots: [] };
    }

    const workingStaff = allStaff.filter((s) =>
      staffWorksOn(s.workDays, dayOfWeek),
    );
    if (workingStaff.length === 0) {
      return { date, isClosed: false, slots: [] };
    }

    const dayStart = combineDateAndMin(date, 0);
    const dayEnd = combineDateAndMin(date, 24 * 60);
    const dayReservations = reservations.filter(
      (r) => r.startAt < dayEnd && r.endAt > dayStart,
    );
    const dayBlocks = blocksByDate.get(date) ?? [];

    const slots: Slot[] = [];
    for (let m = bh.openMin; m + duration <= bh.closeMin; m += slotMin) {
      const slotStart = combineDateAndMin(date, m);
      const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

      if (slotStart < earliestAllowed) {
        slots.push({ startMin: m, status: "past", freeStaffIds: [] });
        continue;
      }

      const freeIds = workingStaff
        .filter((s) => {
          const hasReservation = dayReservations.some(
            (r) =>
              r.staffId === s.id &&
              r.startAt < slotEnd &&
              r.endAt > slotStart,
          );
          if (hasReservation) return false;
          const hasBlock = dayBlocks.some(
            (b) =>
              (b.staffId === null || b.staffId === s.id) &&
              b.startMin < m + duration &&
              b.endMin > m,
          );
          return !hasBlock;
        })
        .map((s) => s.id);

      slots.push({
        startMin: m,
        status: freeIds.length > 0 ? "available" : "full",
        freeStaffIds: freeIds,
      });
    }

    return { date, isClosed: false, slots };
  });
}

/** Single-date wrapper that re-uses the bulk path (admin can keep using this). */
export async function computeAvailability(opts: {
  date: string;
  menuIds: number[];
  staffId?: number | null;
  storeId?: number;
}): Promise<AvailabilityResult> {
  const [r] = await computeAvailabilityRange({ ...opts, startDate: opts.date, numDays: 1 });
  return r;
}

export async function isSlotStillFree(opts: {
  startAt: Date;
  endAt: Date;
  staffId: number | null;
  menuIds: number[];
}): Promise<{ ok: true; staffId: number } | { ok: false; reason: string }> {
  const { startAt, endAt, menuIds } = opts;
  let { staffId } = opts;

  if (menuIds.length === 0) return { ok: false, reason: "メニューが選択されていません" };
  const menus = await prisma.menu.findMany({
    where: { id: { in: menuIds }, active: true },
  });
  if (menus.length !== menuIds.length)
    return { ok: false, reason: "選択されたメニューに無効なものがあります" };

  const earliestAllowed = new Date(
    Date.now() + ADVANCE_BOOKING_MIN * 60 * 1000,
  );
  if (startAt < earliestAllowed) {
    return { ok: false, reason: "当日予約は2時間30分後以降のみ受け付けています" };
  }

  const ymd = `${startAt.getFullYear()}-${String(startAt.getMonth() + 1).padStart(2, "0")}-${String(startAt.getDate()).padStart(2, "0")}`;
  if (await isHoliday(ymd)) {
    return { ok: false, reason: "この日は休業日です" };
  }

  const dayOfWeek = startAt.getDay();
  const candidatesWhere = {
    active: true,
    ...(staffId ? { id: staffId } : {}),
  };
  const staffList = await prisma.staff.findMany({ where: candidatesWhere });
  const working = staffList.filter((s) => staffWorksOn(s.workDays, dayOfWeek));
  if (working.length === 0)
    return { ok: false, reason: "対応可能なスタッフがいません" };

  const startMinOfDay = startAt.getHours() * 60 + startAt.getMinutes();
  const endMinOfDay =
    endAt.getHours() * 60 + endAt.getMinutes() +
    (endAt.getDate() !== startAt.getDate() ? 24 * 60 : 0);
  const dateOnly = ymdToDate(ymd);

  const [overlapping, dayBlocks] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        status: "BOOKED",
        staffId: { in: working.map((s) => s.id) },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { staffId: true },
    }),
    prisma.block.findMany({
      where: { date: dateOnly },
      select: { staffId: true, startMin: true, endMin: true },
    }),
  ]);
  const busyIds = new Set(overlapping.map((r) => r.staffId));
  const blockedFor = (sId: number) =>
    dayBlocks.some(
      (b) =>
        (b.staffId === null || b.staffId === sId) &&
        b.startMin < endMinOfDay &&
        b.endMin > startMinOfDay,
    );

  if (staffId) {
    if (busyIds.has(staffId))
      return { ok: false, reason: "選択されたスタッフは既に予約があります" };
    if (blockedFor(staffId))
      return { ok: false, reason: "この時間は予約停止中です" };
    return { ok: true, staffId };
  }

  const free = working.find((s) => !busyIds.has(s.id) && !blockedFor(s.id));
  if (!free) return { ok: false, reason: "この時間は満席または予約停止中です" };
  return { ok: true, staffId: free.id };
}
