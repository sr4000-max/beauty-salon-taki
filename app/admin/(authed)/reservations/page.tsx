import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  addDays,
  dateToYmd,
  formatJpDate,
  getJstHm,
  startOfDay,
  ymdToDate,
} from "@/lib/time";

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const today = startOfDay(new Date());
  const from = sp.from ? ymdToDate(sp.from) : today;
  const to = sp.to ? ymdToDate(sp.to) : addDays(today, 14);
  const status = sp.status ?? "BOOKED";

  const reservations = await prisma.reservation.findMany({
    where: {
      startAt: { gte: from, lt: addDays(to, 1) },
      ...(status === "ALL" ? {} : { status }),
    },
    include: {
      menu: true,
      staff: true,
      extras: { include: { menu: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { startAt: "asc" },
    take: 200,
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">予約一覧</h1>
        <Link
          href="/admin/reservations/new"
          className="bg-rose-500 hover:bg-rose-600 text-white font-medium px-4 py-2 rounded"
        >
          ＋ 新規予約（電話受付など）
        </Link>
      </div>

      <form
        method="get"
        className="bg-white border border-stone-200 rounded p-4 mb-4 flex flex-wrap gap-3 items-end"
      >
        <div>
          <label className="block text-xs text-stone-500 mb-1">開始日</label>
          <input
            type="date"
            name="from"
            defaultValue={dateToYmd(from)}
            className="border border-stone-300 rounded px-2 py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">終了日</label>
          <input
            type="date"
            name="to"
            defaultValue={dateToYmd(to)}
            className="border border-stone-300 rounded px-2 py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">状態</label>
          <select
            name="status"
            defaultValue={status}
            className="border border-stone-300 rounded px-2 py-1.5"
          >
            <option value="BOOKED">予約中</option>
            <option value="COMPLETED">来店済</option>
            <option value="CANCELLED">キャンセル</option>
            <option value="ALL">すべて</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-stone-900 hover:bg-stone-800 text-white font-medium px-4 py-1.5 rounded"
        >
          絞り込む
        </button>
      </form>

      {reservations.length === 0 ? (
        <p className="bg-white border border-stone-200 rounded p-6 text-center text-stone-500">
          該当する予約はありません
        </p>
      ) : (
        <div className="bg-white border border-stone-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="text-left px-3 py-2">日時</th>
                <th className="text-left px-3 py-2">お客様</th>
                <th className="text-left px-3 py-2">メニュー</th>
                <th className="text-left px-3 py-2">担当</th>
                <th className="text-left px-3 py-2">経路</th>
                <th className="text-left px-3 py-2">状態</th>
                <th className="text-right px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="border-t border-stone-100">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatJpDate(r.startAt)}{" "}
                    <span className="font-mono">
                      {fmt(r.startAt)}–{fmt(r.endAt)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div>{r.customerName}</div>
                    <div className="text-xs text-stone-500">{r.customerPhone}</div>
                  </td>
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
                  <td className="px-3 py-2 text-xs text-stone-500">
                    {r.source === "WEB" ? "WEB" : "管理画面"}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={r.status} />
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

function fmt(d: Date) {
  return getJstHm(d);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    BOOKED: ["予約中", "bg-blue-100 text-blue-800"],
    COMPLETED: ["来店済", "bg-green-100 text-green-800"],
    CANCELLED: ["キャンセル", "bg-stone-200 text-stone-600"],
  };
  const [label, cls] = map[status] ?? [status, "bg-stone-100"];
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs ${cls}`}>
      {label}
    </span>
  );
}
