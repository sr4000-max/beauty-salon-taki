import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatJpDateLong, getJstHm } from "@/lib/time";
import {
  TICKET_STATUS_LABEL,
  daysUntilExpiry,
  getTicketStatus,
} from "@/lib/ticket-status";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";

export const metadata = { title: "回数券残数確認｜Beauty Salon TAKI" };
export const dynamic = "force-dynamic"; // 残数は常に最新を表示する

export default async function TicketViewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { token },
    include: {
      logs: {
        where: { action: "use" },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!ticket) notFound();

  const status = getTicketStatus(ticket);
  const remaining = ticket.totalCount - ticket.usedCount;
  const daysLeft = daysUntilExpiry(ticket.expiresAt);

  // ステータスごとに表示色を切り替え (Phase 2: 期限切れアラート)
  const statusColor =
    status === "active"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : status === "expired"
        ? "bg-red-50 text-red-800 border-red-300"
        : "bg-stone-100 text-stone-600 border-stone-300";

  const remainingColor =
    status === "active"
      ? "text-[color:var(--color-accent-dark)]"
      : status === "expired"
        ? "text-red-700"
        : "text-stone-400";

  return (
    <>
      <SiteHeader />

      <section className="page-head">
        <div className="page-head-inner">
          <p className="section-en">Ticket</p>
          <h1 className="page-title">回数券</h1>
          <p className="page-desc">{ticket.customerName} 様の残数</p>
        </div>
      </section>

      <section className="section">
        <div className="container container-narrow">
          <div className="bg-white border border-[var(--color-line)] rounded-sm p-8 mb-6 text-center">
            <p className="text-xs tracking-widest text-[color:var(--color-accent)] mb-2">
              {ticket.treatment.toUpperCase()}
            </p>
            <h2 className="font-[var(--font-jp-serif)] text-2xl mb-1">
              {ticket.treatment}
            </h2>

            <div
              className={`inline-block mt-3 mb-6 px-3 py-0.5 rounded-sm border text-xs font-medium ${statusColor}`}
            >
              {TICKET_STATUS_LABEL[status]}
            </div>

            <div className="mb-2 text-xs text-[color:var(--color-text-light)] tracking-widest">
              REMAINING
            </div>
            <div className={`mb-1 ${remainingColor}`}>
              <span className="font-[var(--font-jp-serif)] text-6xl font-medium tabular-nums">
                {remaining}
              </span>
              <span className="text-2xl text-[color:var(--color-text-light)] ml-1 mr-2">
                /
              </span>
              <span className="text-2xl text-[color:var(--color-text-light)] tabular-nums">
                {ticket.totalCount}
              </span>
              <span className="text-base text-[color:var(--color-text-light)] ml-2">
                回
              </span>
            </div>

            {ticket.expiresAt && (
              <p
                className={`mt-4 text-sm ${
                  status === "expired"
                    ? "text-red-700 font-bold"
                    : daysLeft !== null && daysLeft <= 30
                      ? "text-amber-700"
                      : "text-[color:var(--color-text-light)]"
                }`}
              >
                有効期限: {formatJpDateLong(ticket.expiresAt)}
                {status === "expired" ? (
                  <span className="ml-2">（期限切れ）</span>
                ) : daysLeft !== null && daysLeft <= 30 ? (
                  <span className="ml-2">（残り {daysLeft} 日）</span>
                ) : null}
              </p>
            )}

            {status === "expired" && (
              <div className="mt-5 p-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-800 text-left">
                ⚠ こちらの回数券は有効期限が過ぎております。<br />
                ご使用の際は店舗までお問い合わせください。
              </div>
            )}
          </div>

          {/* 施術履歴 */}
          {ticket.logs.length > 0 && (
            <div className="bg-white border border-[var(--color-line)] rounded-sm p-6 mb-6">
              <h3 className="font-[var(--font-jp-serif)] font-medium mb-3">
                施術履歴
              </h3>
              <ol className="space-y-1.5 text-sm">
                {ticket.logs.map((log, i) => (
                  <li
                    key={log.id}
                    className="flex justify-between border-b border-dashed border-[var(--color-line)] pb-1.5 last:border-b-0"
                  >
                    <span className="text-[color:var(--color-text-light)]">
                      #{ticket.logs.length - i} 回目
                    </span>
                    <span>
                      {formatJpDateLong(log.createdAt)} {getJstHm(log.createdAt)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <p className="text-xs text-[color:var(--color-text-light)] text-center">
            ※ このページの残数はリアルタイムで更新されます<br />
            ※ ご不明な点は{" "}
            <Link
              href="tel:0996-22-4342"
              className="text-[color:var(--color-accent)] underline"
            >
              0996-22-4342
            </Link>{" "}
            までお問い合わせください
          </p>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
