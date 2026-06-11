import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatJpDateLong } from "@/lib/time";
import { TicketPdfClient } from "./_TicketPdfClient";

export const metadata = { title: "回数券 PDF" };

async function buildBaseUrl(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export default async function TicketPdfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id: Number(id) },
  });
  if (!ticket) notFound();
  const store = await prisma.store.findFirst();
  const baseUrl = await buildBaseUrl();
  const customerUrl = `${baseUrl}/tickets/${ticket.token}`;
  const expiresLabel = ticket.expiresAt
    ? formatJpDateLong(ticket.expiresAt)
    : null;

  return (
    <TicketPdfClient
      customerName={ticket.customerName}
      treatment={ticket.treatment}
      totalCount={ticket.totalCount}
      expiresLabel={expiresLabel}
      storePhone={store?.phone ?? null}
      customerUrl={customerUrl}
      ticketId={ticket.id}
    />
  );
}
