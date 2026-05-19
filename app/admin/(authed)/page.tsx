import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { addDays, formatJpDateLong, getJstHm, startOfDay } from "@/lib/time";

const statusLabel: Record<string, string> = {
  BOOKED: "予約中",
  COMPLETED: "来店済",
  CANCELLED: "キャンセル",
};

const statusClass: Record<string, string> = {
  BOOKED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-stone-200 text-stone-600 line-through",
};

export default async function AdminHome() {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const inAWeek = addDays(today, 7);

  const [todays, upcoming, totalCounts, staffCount, menuCount] =
    await Promise.all([
      prisma.reservation.findMany({
        where: { startAt: { gte: today, lt: tomorrow } },
        include: {
          menu: true,
          staff: true,
          extras: { include: { menu: true }, orderBy: { sortOrder: "asc" } },
        },
        orderBy: { startAt: "asc" },
      }),
      prisma.reservation.count({
        where: {
          startAt: { gte: tomorrow, lt: inAWeek },
          status: "BOOKED",
        },
      }),
      prisma.reservation.groupBy({
        by: ["status"],
        _count: { _all: true },
        where: { startAt: { gte: today, lt: tomorrow } },
      }),
      prisma.staff.count({ where: { active: true } }),
      prisma.menu.count({ where: { active: true } }),
    ]);

  const todayBooked = totalCounts.find((c) => c.status === "BOOKED")?._count
    ._all ?? 0;
  const todayDone = totalCounts.find((c) => c.status === "COMPLETED")?._count
    ._all ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ダッシュボード</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Card label="本日の予約" value={todayBooked} />
        <Card label="本日 来店済" value={todayDone} />
        <Card label="今後7日の予約" value={upcoming} />
        <Card label="アクティブメニュー" value={menuCount} />
      </div>

      {staffCount === 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded">
          スタッフが未登録です。
          <Link
            href="/admin/staff"
            className="text-amber-900 underline font-medium ml-1"
          >
            スタッフを追加
          </Link>
          してください。
        </div>
      )}
      {menuCount === 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded">
          メニューが未登録です。
          <Link
            href="/admin/menus"
            className="text-amber-900 underline font-medium ml-1"
          >
            メニューを追加
          </Link>
          してください。
        </div>
      )}

      <h2 className="text-lg font-bold mb-3">{formatJpDateLong(today)} の予約</h2>
      {todays.length === 0 ? (
        <p className="text-stone-500 bg-white border border-stone-200 rounded p-6 text-center">
          本日の予約はありません
        </p>
      ) : (
        <div className="bg-white border border-stone-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="text-left px-3 py-2">時間</th>
                <th className="text-left px-3 py-2">お客様</th>
                <th className="text-left px-3 py-2">メニュー</th>
                <th className="text-left px-3 py-2">担当</th>
                <th className="text-left px-3 py-2">状態</th>
                <th className="text-right px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {todays.map((r) => (
                <tr key={r.id} className="border-t border-stone-100">
                  <td className="px-3 py-2 font-mono">
                    {fmtHm(r.startAt)}–{fmtHm(r.endAt)}
                  </td>
                  <td className="px-3 py-2">{r.customerName}</td>
                  <td className="px-3 py-2">
                    {r.menu.name}
                    {r.extras.length > 0 && (
                      <span
                        className="ml-1.5 text-xs text-stone-500"
                        title={r.extras.map((e) => e.menu.name).join(" / ")}
                      >
                        +{r.extras.length}件
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">{r.staff?.name ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs ${statusClass[r.status]}`}
                    >
                      {statusLabel[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/admin/reservations/${r.id}`}
                      className="text-stone-700 hover:underline"
                    >
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-stone-200 rounded p-4">
      <div className="text-xs text-stone-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function fmtHm(d: Date): string {
  return getJstHm(d);
}
