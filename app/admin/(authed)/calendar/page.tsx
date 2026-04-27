import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toggleHolidayAction } from "@/lib/actions/holiday";
import { createBlockAction, deleteBlockAction } from "@/lib/actions/block";
import {
  addDays,
  combineDateAndMin,
  dateToYmd,
  formatJpDateLong,
  minToTimeStr,
  startOfDay,
  ymdToDate,
} from "@/lib/time";

const STRIPED_BG: React.CSSProperties = {
  backgroundColor: "#a8a29e",
  backgroundImage:
    "repeating-linear-gradient(45deg, transparent 0, transparent 6px, rgba(255,255,255,0.18) 6px, rgba(255,255,255,0.18) 12px)",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const today = startOfDay(new Date());
  const date = sp.date ? ymdToDate(sp.date) : today;
  const ymd = dateToYmd(date);
  const dayOfWeek = date.getDay();
  const dateOnly = ymdToDate(ymd);

  const [store, staff, reservations, holiday, blocks] = await Promise.all([
    prisma.store.findFirst({ include: { businessHours: true } }),
    prisma.staff.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
    prisma.reservation.findMany({
      where: {
        status: { in: ["BOOKED", "COMPLETED"] },
        startAt: { gte: combineDateAndMin(ymd, 0) },
        endAt: { lte: combineDateAndMin(ymd, 24 * 60) },
      },
      include: {
        menu: true,
        extras: { include: { menu: true }, orderBy: { sortOrder: "asc" } },
      },
      orderBy: { startAt: "asc" },
    }),
    prisma.holiday.findUnique({ where: { date: dateOnly } }),
    prisma.block.findMany({
      where: { date: dateOnly },
      orderBy: { startMin: "asc" },
    }),
  ]);

  const bh = store?.businessHours.find((b) => b.dayOfWeek === dayOfWeek);
  const slotMin = store?.slotMinutes ?? 30;
  const openMin = bh && !bh.isClosed ? bh.openMin : 600;
  const closeMin = bh && !bh.isClosed ? bh.closeMin : 1140;
  const isWeeklyClosed = !bh || bh.isClosed;
  const isHoliday = !!holiday;
  const isClosed = isWeeklyClosed || isHoliday;

  const slots: number[] = [];
  for (let m = openMin; m < closeMin; m += slotMin) slots.push(m);

  const slotMinutes = slotMin;

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">カレンダー</h1>
        <Link
          href={`/admin/reservations/new?date=${ymd}`}
          className="bg-rose-500 hover:bg-rose-600 text-white font-medium px-4 py-2 rounded text-sm"
        >
          ＋ 新規予約
        </Link>
      </div>

      <div className="bg-white border border-stone-200 rounded p-4 mb-3 flex items-center gap-2 flex-wrap">
        <Link
          href={`/admin/calendar?date=${dateToYmd(addDays(date, -1))}`}
          className="border border-stone-300 hover:bg-stone-50 px-3 py-1.5 rounded text-sm"
        >
          ← 前日
        </Link>
        <Link
          href={`/admin/calendar?date=${dateToYmd(today)}`}
          className="border border-stone-300 hover:bg-stone-50 px-3 py-1.5 rounded text-sm"
        >
          今日
        </Link>
        <Link
          href={`/admin/calendar?date=${dateToYmd(addDays(date, 1))}`}
          className="border border-stone-300 hover:bg-stone-50 px-3 py-1.5 rounded text-sm"
        >
          翌日 →
        </Link>
        <form method="get" className="flex items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={ymd}
            className="border border-stone-300 rounded px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="text-sm border border-stone-300 hover:bg-stone-50 px-3 py-1.5 rounded"
          >
            移動
          </button>
        </form>
        <span className="ml-2 font-bold">{formatJpDateLong(date)}</span>
        {isWeeklyClosed && !isHoliday && (
          <span className="px-2 py-0.5 bg-stone-200 text-stone-700 text-xs rounded">
            定休日
          </span>
        )}
        {isHoliday && (
          <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-xs rounded">
            休業設定中{holiday?.note ? `（${holiday.note}）` : ""}
          </span>
        )}
      </div>

      <div className="bg-white border border-stone-200 rounded p-4 mb-3 flex flex-wrap items-end gap-3">
        <form action={toggleHolidayAction} className="flex items-end gap-2">
          <input type="hidden" name="date" value={ymd} />
          {!isHoliday && (
            <div>
              <label className="block text-xs text-stone-500 mb-1">休業理由（任意）</label>
              <input
                type="text"
                name="note"
                placeholder="例: 臨時休業"
                className="border border-stone-300 rounded px-2 py-1.5 text-sm w-40"
              />
            </div>
          )}
          <button
            type="submit"
            className={`text-sm font-medium px-3 py-1.5 rounded ${
              isHoliday
                ? "border border-stone-300 hover:bg-stone-50 text-stone-700"
                : "bg-amber-500 hover:bg-amber-600 text-white"
            }`}
          >
            {isHoliday ? "休業を解除" : "この日を休みにする"}
          </button>
        </form>

        <div className="border-l border-stone-200 pl-3 flex items-end gap-2 flex-wrap">
          <form action={createBlockAction} className="flex items-end gap-2 flex-wrap">
            <input type="hidden" name="date" value={ymd} />
            <div>
              <label className="block text-xs text-stone-500 mb-1">予約停止 開始</label>
              <input
                type="time"
                name="startTime"
                step={slotMinutes * 60}
                required
                defaultValue="12:00"
                className="border border-stone-300 rounded px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">終了</label>
              <input
                type="time"
                name="endTime"
                step={slotMinutes * 60}
                required
                defaultValue="13:00"
                className="border border-stone-300 rounded px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">対象</label>
              <select
                name="staffId"
                className="border border-stone-300 rounded px-2 py-1.5 text-sm"
                defaultValue="all"
              >
                <option value="all">全スタッフ</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">メモ</label>
              <input
                type="text"
                name="note"
                placeholder="例: 休憩"
                className="border border-stone-300 rounded px-2 py-1.5 text-sm w-32"
              />
            </div>
            <button
              type="submit"
              className="bg-stone-700 hover:bg-stone-800 text-white text-sm font-medium px-3 py-1.5 rounded"
            >
              予約停止を追加
            </button>
          </form>
        </div>
      </div>

      {blocks.length > 0 && (
        <div className="bg-white border border-stone-200 rounded p-3 mb-3">
          <div className="text-xs text-stone-500 mb-2">本日の予約停止枠</div>
          <ul className="flex flex-wrap gap-2">
            {blocks.map((b) => {
              const target = b.staffId
                ? staff.find((s) => s.id === b.staffId)?.name ?? "—"
                : "全員";
              return (
                <li
                  key={b.id}
                  className="flex items-center gap-2 px-2.5 py-1 rounded text-sm"
                  style={STRIPED_BG}
                >
                  <span className="text-white font-medium">
                    {minToTimeStr(b.startMin)}–{minToTimeStr(b.endMin)} / {target}
                    {b.note ? ` （${b.note}）` : ""}
                  </span>
                  <form action={deleteBlockAction}>
                    <input type="hidden" name="id" value={b.id} />
                    <button
                      type="submit"
                      className="text-white hover:text-red-200 text-xs"
                      title="削除"
                    >
                      ×
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {staff.length === 0 ? (
        <p className="bg-amber-50 border border-amber-200 rounded p-6 text-center">
          スタッフが登録されていません
        </p>
      ) : (
        <div className="bg-white border border-stone-200 rounded overflow-x-auto">
          <table className="border-collapse w-full text-sm">
            <thead>
              <tr>
                <th className="bg-stone-50 sticky left-0 z-10 w-16 px-2 py-2 border-b border-r border-stone-200 text-xs">
                  時刻
                </th>
                {staff.map((s) => (
                  <th
                    key={s.id}
                    className="border-b border-stone-200 px-2 py-2 text-sm font-medium min-w-[10rem]"
                  >
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-1.5 align-middle"
                      style={{ background: s.color }}
                    />
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map((m) => (
                <tr key={m}>
                  <th className="bg-stone-50 sticky left-0 z-10 px-2 py-1 border-r border-b border-stone-100 font-mono text-xs text-stone-600 h-10">
                    {minToTimeStr(m)}
                  </th>
                  {staff.map((s) => {
                    const cellStart = combineDateAndMin(ymd, m);
                    const cellEnd = combineDateAndMin(ymd, m + slotMin);
                    const startsHere = reservations.find(
                      (r) =>
                        r.staffId === s.id &&
                        r.startAt.getTime() === cellStart.getTime(),
                    );
                    const ongoing = reservations.find(
                      (r) =>
                        r.staffId === s.id &&
                        r.startAt < cellStart &&
                        r.endAt > cellStart,
                    );
                    if (ongoing) return null;
                    if (startsHere) {
                      const span = Math.max(
                        1,
                        Math.ceil(
                          (startsHere.endAt.getTime() -
                            startsHere.startAt.getTime()) /
                            (slotMin * 60 * 1000),
                        ),
                      );
                      const cancelled = startsHere.status === "CANCELLED";
                      const completed = startsHere.status === "COMPLETED";
                      const baseColor = cancelled ? "#a8a29e" : s.color;
                      const bg = cancelled
                        ? "#e7e5e4"
                        : completed
                          ? "#dcfce7"
                          : `${s.color}33`;
                      return (
                        <td
                          key={s.id}
                          rowSpan={span}
                          className="p-0 border-b border-stone-100 align-top"
                          style={{
                            backgroundColor: bg,
                            borderLeft: `6px solid ${baseColor}`,
                          }}
                        >
                          <Link
                            href={`/admin/reservations/${startsHere.id}`}
                            className={`block w-full h-full p-1.5 text-xs leading-tight hover:opacity-80 transition ${
                              cancelled
                                ? "text-stone-500 line-through"
                                : completed
                                  ? "text-green-900"
                                  : "text-stone-900"
                            }`}
                          >
                            <div className="font-bold truncate">
                              {minToTimeStr(
                                startsHere.startAt.getHours() * 60 +
                                  startsHere.startAt.getMinutes(),
                              )}
                              {" "}
                              {startsHere.customerName}
                            </div>
                            <div
                              className="truncate"
                              title={
                                startsHere.extras.length > 0
                                  ? [
                                      startsHere.menu.name,
                                      ...startsHere.extras.map(
                                        (e) => e.menu.name,
                                      ),
                                    ].join(" / ")
                                  : undefined
                              }
                            >
                              {startsHere.menu.name}
                              {startsHere.extras.length > 0 && (
                                <span className="ml-1 text-[10px] opacity-70">
                                  +{startsHere.extras.length}
                                </span>
                              )}
                            </div>
                          </Link>
                        </td>
                      );
                    }

                    const blockHere = blocks.find(
                      (b) =>
                        (b.staffId === null || b.staffId === s.id) &&
                        b.startMin <= m &&
                        b.endMin > m,
                    );
                    const blockStartsHere =
                      blockHere && blockHere.startMin === m;
                    if (blockHere && !blockStartsHere) return null;
                    if (blockStartsHere) {
                      const span = Math.max(
                        1,
                        Math.ceil(
                          (blockHere!.endMin - blockHere!.startMin) / slotMin,
                        ),
                      );
                      return (
                        <td
                          key={s.id}
                          rowSpan={span}
                          className="p-0 border-b border-stone-100 align-top"
                          style={STRIPED_BG}
                        >
                          <div className="h-full p-1.5 text-xs text-white font-medium">
                            予約停止
                            {blockHere!.note ? `（${blockHere!.note}）` : ""}
                          </div>
                        </td>
                      );
                    }

                    if (isClosed) {
                      return (
                        <td
                          key={s.id}
                          className="border-b border-stone-100 h-10 p-0"
                          style={STRIPED_BG}
                        />
                      );
                    }
                    return (
                      <td
                        key={s.id}
                        className="border-b border-stone-100 p-0 h-10"
                      >
                        <Link
                          href={`/admin/reservations/new?date=${ymd}&time=${minToTimeStr(m)}&staffId=${s.id}`}
                          className="block w-full h-full hover:bg-rose-50/60 transition"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
