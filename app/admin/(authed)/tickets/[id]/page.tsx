import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  cancelLastUseAction,
  deleteTicketAction,
  useTicketAction,
} from "@/lib/actions/ticket";
import {
  TICKET_STATUS_LABEL,
  daysUntilExpiry,
  getTicketStatus,
} from "@/lib/ticket-status";
import { formatJpDateLong, getJstHm } from "@/lib/time";
import { TicketQR } from "./_TicketQR";

async function buildBaseUrl(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id: Number(id) },
    include: {
      logs: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!ticket) notFound();

  const status = getTicketStatus(ticket);
  const remaining = ticket.totalCount - ticket.usedCount;
  const daysLeft = daysUntilExpiry(ticket.expiresAt);
  const baseUrl = await buildBaseUrl();
  const customerUrl = `${baseUrl}/tickets/${ticket.token}`;
  const usedLogCount = ticket.logs.filter((l) => l.action === "use").length;

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/admin/tickets"
        className="text-sm text-stone-600 hover:underline"
      >
        ← 回数券一覧へ
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">回数券 #{ticket.id}</h1>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* 左カラム: 情報 */}
        <div className="bg-white border border-stone-200 rounded p-6 space-y-3">
          <Row label="お客様" value={ticket.customerName} />
          <Row label="施術" value={ticket.treatment} />
          <div className="flex">
            <dt className="w-24 text-stone-500 shrink-0 text-sm">残数</dt>
            <dd className="flex-1">
              <span className="text-2xl font-bold tabular-nums">
                {remaining}
              </span>
              <span className="text-stone-400"> / {ticket.totalCount} 回</span>
              {status === "active" && remaining <= 1 && (
                <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded">
                  残りわずか
                </span>
              )}
            </dd>
          </div>
          <Row
            label="有効期限"
            value={
              ticket.expiresAt
                ? `${formatJpDateLong(ticket.expiresAt)}${
                    status === "expired"
                      ? "（期限切れ）"
                      : daysLeft !== null && daysLeft <= 30
                        ? `（残り${daysLeft}日）`
                        : ""
                  }`
                : "—"
            }
            valueColor={
              status === "expired"
                ? "text-red-700 font-bold"
                : daysLeft !== null && daysLeft <= 30
                  ? "text-amber-700"
                  : undefined
            }
          />
          <Row
            label="状態"
            value={TICKET_STATUS_LABEL[status]}
            valueColor={
              status === "expired"
                ? "text-red-700 font-bold"
                : status === "usedUp"
                  ? "text-stone-500"
                  : "text-emerald-700"
            }
          />
          {ticket.note && <Row label="メモ" value={ticket.note} />}
          <Row label="発行日" value={formatJpDateLong(ticket.createdAt)} />
        </div>

        {/* 右カラム: QR */}
        <div className="bg-white border border-stone-200 rounded p-6 flex flex-col items-center">
          <p className="text-sm font-medium mb-3">お客様向け QR コード</p>
          <TicketQR url={customerUrl} />
          <div className="mt-4 flex gap-2">
            <a
              href={`/admin/tickets/${ticket.id}/print`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-stone-700 hover:bg-stone-800 text-white text-sm font-medium px-4 py-1.5 rounded"
            >
              🖨 印刷
            </a>
          </div>
        </div>
      </div>

      {/* 消化ボタン */}
      <div className="bg-white border border-stone-200 rounded p-6 mb-6">
        <h2 className="font-bold mb-3">施術消化</h2>
        {status === "active" ? (
          <form action={useTicketAction} className="flex flex-wrap gap-2 items-end">
            <input type="hidden" name="id" value={ticket.id} />
            <div className="flex-1 min-w-48">
              <label className="block text-xs text-stone-500 mb-1">
                メモ（任意・社内向け）
              </label>
              <input
                type="text"
                name="staffNote"
                maxLength={200}
                placeholder="例: スタッフ名・コメント"
                className="w-full border border-stone-300 rounded px-3 py-2"
              />
            </div>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2 rounded"
            >
              ✓ 1 回消化する
            </button>
          </form>
        ) : status === "expired" ? (
          <p className="text-red-700 bg-red-50 border border-red-200 rounded p-3">
            この回数券は期限切れです。消化操作はできません。
          </p>
        ) : (
          <p className="text-stone-500 bg-stone-50 border border-stone-200 rounded p-3">
            この回数券は使い切りです。
          </p>
        )}

        {ticket.usedCount > 0 && (
          <form action={cancelLastUseAction} className="mt-3">
            <input type="hidden" name="id" value={ticket.id} />
            <button
              type="submit"
              className="text-xs text-red-700 hover:underline"
            >
              ↶ 直前の消化を 1 件取り消す
            </button>
          </form>
        )}
      </div>

      {/* 履歴 */}
      <div className="bg-white border border-stone-200 rounded p-6 mb-6">
        <h2 className="font-bold mb-3">履歴（{ticket.logs.length}件）</h2>
        {ticket.logs.length === 0 ? (
          <p className="text-stone-500 text-sm">履歴はありません</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {ticket.logs.map((log) => {
              const label =
                log.action === "issued"
                  ? "発行"
                  : log.action === "use"
                    ? "消化"
                    : log.action === "cancel"
                      ? "消化取消"
                      : log.action;
              const cls =
                log.action === "use"
                  ? "text-emerald-700"
                  : log.action === "cancel"
                    ? "text-red-700"
                    : "text-stone-500";
              return (
                <li
                  key={log.id}
                  className="flex justify-between border-b border-stone-100 pb-2 last:border-b-0"
                >
                  <span className={cls + " font-medium w-20"}>{label}</span>
                  <span className="flex-1 text-stone-600">
                    {log.staffNote ?? ""}
                  </span>
                  <span className="text-stone-500 text-xs">
                    {formatJpDateLong(log.createdAt)} {getJstHm(log.createdAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 削除 */}
      {usedLogCount === 0 && (
        <div className="bg-white border border-stone-200 rounded p-4">
          <form action={deleteTicketAction}>
            <input type="hidden" name="id" value={ticket.id} />
            <button
              type="submit"
              className="text-xs text-red-700 hover:underline"
            >
              この回数券を削除する（消化履歴がないため可）
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex text-sm">
      <dt className="w-24 text-stone-500 shrink-0">{label}</dt>
      <dd className={`flex-1 break-all ${valueColor ?? ""}`}>{value}</dd>
    </div>
  );
}
