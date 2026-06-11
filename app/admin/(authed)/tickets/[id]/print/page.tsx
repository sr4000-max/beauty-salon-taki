import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatJpDateLong } from "@/lib/time";
import { TicketQR } from "../_TicketQR";
import { PrintAutoTrigger, PrintButton } from "./_PrintAutoTrigger";

export const metadata = { title: "回数券カード印刷" };

async function buildBaseUrl(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export default async function TicketPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id: Number(id) },
  });
  if (!ticket) notFound();
  const baseUrl = await buildBaseUrl();
  const customerUrl = `${baseUrl}/tickets/${ticket.token}`;
  const store = await prisma.store.findFirst();

  return (
    <>
      <PrintAutoTrigger />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page { size: A6; margin: 0; }
            html, body { background: #fff; }
            body { margin: 0; padding: 0; }
            .ticket-card {
              width: 105mm;
              height: 148mm;
              padding: 12mm 10mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", system-ui, sans-serif;
              color: #2d2620;
              border: 1px solid #ddd;
              margin: 10mm auto;
              background: #fff;
            }
            .ticket-card h1 {
              font-family: "Cormorant Garamond", serif;
              font-size: 18pt;
              font-weight: 500;
              letter-spacing: 0.1em;
              margin: 0 0 2mm;
              color: #8a7860;
            }
            .ticket-card .salon-jp {
              font-size: 8pt;
              color: #8a7860;
              letter-spacing: 0.2em;
              margin-bottom: 4mm;
            }
            .ticket-card .customer-name {
              font-size: 14pt;
              font-weight: 500;
              margin: 0 0 1mm;
              text-align: center;
            }
            .ticket-card .treatment {
              font-size: 10pt;
              color: #6b5f55;
              margin: 0 0 4mm;
              text-align: center;
            }
            .ticket-card .count-info {
              font-size: 9pt;
              color: #555;
              margin-bottom: 3mm;
            }
            .ticket-card .qr-wrap {
              padding: 2mm;
              border: 1px solid #eee;
              background: #fff;
            }
            .ticket-card .footer-note {
              font-size: 7pt;
              color: #888;
              line-height: 1.5;
              text-align: center;
              margin-top: 4mm;
            }
            .ticket-card .footer-note .url {
              font-family: monospace;
              font-size: 6pt;
              color: #aaa;
              word-break: break-all;
            }
            .print-actions {
              max-width: 105mm;
              margin: 6mm auto;
              text-align: center;
            }
            @media print {
              .print-actions { display: none; }
              .ticket-card {
                margin: 0 auto;
                border: none;
              }
            }
          `,
        }}
      />

      <div className="print-actions">
        <PrintButton />
        <a
          href={`/admin/tickets/${ticket.id}`}
          className="text-sm text-stone-600 underline ml-2"
        >
          ← 戻る
        </a>
      </div>

      <article className="ticket-card">
        <header style={{ textAlign: "center" }}>
          <h1>Beauty Salon TAKI</h1>
          <div className="salon-jp">ビューティーサロンたき</div>
        </header>

        <div style={{ textAlign: "center" }}>
          <div className="customer-name">{ticket.customerName} 様</div>
          <div className="treatment">{ticket.treatment}</div>
          <div className="count-info">
            {ticket.totalCount} 回コース
            {ticket.expiresAt && (
              <> ／ 有効期限 {formatJpDateLong(ticket.expiresAt)}</>
            )}
          </div>
        </div>

        <div className="qr-wrap">
          <TicketQR url={customerUrl} size={180} />
        </div>

        <div className="footer-note">
          このQRコードで残数確認ができます<br />
          {store?.phone && <>TEL: {store.phone}　</>}
          <span className="url">{customerUrl}</span>
        </div>
      </article>
    </>
  );
}
