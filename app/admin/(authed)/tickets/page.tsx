import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  TICKET_STATUS_LABEL,
  daysUntilExpiry,
  getTicketStatus,
  type TicketStatus,
} from "@/lib/ticket-status";
import { formatJpDateLong } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function TicketListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const filterStatus = sp.status ?? "active";

  const tickets = await prisma.ticket.findMany({
    where: q
      ? {
          OR: [
            { customerName: { contains: q, mode: "insensitive" } },
            { treatment: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ createdAt: "desc" }],
  });

  const withStatus = tickets.map((t) => ({
    ...t,
    status: getTicketStatus(t),
    remaining: t.totalCount - t.usedCount,
    daysLeft: daysUntilExpiry(t.expiresAt),
  }));

  const filtered =
    filterStatus === "all"
      ? withStatus
      : withStatus.filter((t) => t.status === (filterStatus as TicketStatus));

  // 残数少ない順 + 期限近い順 を加味
  filtered.sort((a, b) => {
    if (a.status !== b.status) {
      const order: Record<TicketStatus, number> = { active: 0, expired: 1, usedUp: 2 };
      return order[a.status] - order[b.status];
    }
    if (a.remaining !== b.remaining) return a.remaining - b.remaining;
    if (a.daysLeft !== null && b.daysLeft !== null) return a.daysLeft - b.daysLeft;
    return 0;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">回数券</h1>
        <Link
          href="/admin/tickets/new"
          className="bg-rose-500 hover:bg-rose-600 text-white font-medium px-4 py-2 rounded text-sm"
        >
          ＋ 新規発行
        </Link>
      </div>

      <form
        method="get"
        className="bg-white border border-stone-200 rounded p-4 mb-4 flex flex-wrap gap-3 items-end"
      >
        <div>
          <label className="block text-xs text-stone-500 mb-1">
            お客様名 / 施術種別
          </label>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="検索..."
            className="border border-stone-300 rounded px-3 py-1.5 text-sm w-64"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1">状態</label>
          <select
            name="status"
            defaultValue={filterStatus}
            className="border border-stone-300 rounded px-2 py-1.5 text-sm"
          >
            <option value="active">有効</option>
            <option value="expired">期限切れ</option>
            <option value="usedUp">使い切り</option>
            <option value="all">すべて</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-stone-900 hover:bg-stone-800 text-white font-medium px-4 py-1.5 rounded text-sm"
        >
          絞り込む
        </button>
      </form>

      {filtered.length === 0 ? (
        <p className="bg-white border border-stone-200 rounded p-6 text-center text-stone-500">
          該当する回数券はありません
        </p>
      ) : (
        <div className="bg-white border border-stone-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="text-left px-3 py-2">お客様</th>
                <th className="text-left px-3 py-2">施術</th>
                <th className="text-left px-3 py-2">残数</th>
                <th className="text-left px-3 py-2">有効期限</th>
                <th className="text-left px-3 py-2">状態</th>
                <th className="text-right px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                // 行ハイライト: 期限切れは赤、残り30日以内は黄、残り1回は黄
                const rowClass =
                  t.status === "expired"
                    ? "bg-red-50"
                    : t.status === "active" &&
                        ((t.daysLeft !== null && t.daysLeft <= 30) || t.remaining <= 1)
                      ? "bg-amber-50"
                      : t.status === "usedUp"
                        ? "bg-stone-50"
                        : "";
                return (
                  <tr
                    key={t.id}
                    className={`border-t border-stone-100 ${rowClass}`}
                  >
                    <td className="px-3 py-2 font-medium">{t.customerName}</td>
                    <td className="px-3 py-2">{t.treatment}</td>
                    <td className="px-3 py-2 tabular-nums">
                      <span
                        className={
                          t.status === "active"
                            ? t.remaining <= 1
                              ? "text-amber-700 font-bold"
                              : ""
                            : "text-stone-400"
                        }
                      >
                        {t.remaining}
                      </span>
                      <span className="text-stone-400"> / {t.totalCount}</span>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {t.expiresAt ? (
                        <>
                          {formatJpDateLong(t.expiresAt)}
                          {t.daysLeft !== null && t.status !== "expired" && t.daysLeft <= 30 && (
                            <span className="ml-1 text-amber-700">
                              ({t.daysLeft}日)
                            </span>
                          )}
                          {t.status === "expired" && (
                            <span className="ml-1 text-red-700 font-bold">
                              （切）
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/admin/tickets/${t.id}`}
                        className="text-stone-700 hover:underline"
                      >
                        詳細
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const cls =
    status === "active"
      ? "bg-emerald-100 text-emerald-800"
      : status === "expired"
        ? "bg-red-100 text-red-800"
        : "bg-stone-200 text-stone-600";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs ${cls}`}>
      {TICKET_STATUS_LABEL[status]}
    </span>
  );
}
