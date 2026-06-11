"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ymdToDate } from "@/lib/time";

function generateToken(): string {
  return randomBytes(16).toString("hex");
}

const createSchema = z.object({
  customerName: z.string().min(1).max(50),
  treatment: z.string().min(1).max(100),
  totalCount: z.coerce.number().int().min(1).max(999),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  note: z.string().max(500).optional().or(z.literal("")),
});

export async function createTicketAction(formData: FormData) {
  await requireAdmin();
  const parsed = createSchema.parse({
    customerName: formData.get("customerName"),
    treatment: formData.get("treatment"),
    totalCount: formData.get("totalCount"),
    expiresAt: formData.get("expiresAt") ?? "",
    note: formData.get("note") ?? "",
  });

  // 23:59 JST 時点を期限としたい (その日の閉店までは有効)
  const expiresAt = parsed.expiresAt
    ? new Date(ymdToDate(parsed.expiresAt).getTime() + 24 * 60 * 60 * 1000 - 1)
    : null;

  const created = await prisma.ticket.create({
    data: {
      token: generateToken(),
      customerName: parsed.customerName,
      treatment: parsed.treatment,
      totalCount: parsed.totalCount,
      usedCount: 0,
      expiresAt,
      note: parsed.note || null,
      logs: {
        create: [{ action: "issued" }],
      },
    },
  });

  revalidatePath("/admin/tickets");
  redirect(`/admin/tickets/${created.id}`);
}

const useSchema = z.object({
  id: z.coerce.number().int().positive(),
  staffNote: z.string().max(200).optional().or(z.literal("")),
});

export async function useTicketAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = useSchema.parse({
    id: formData.get("id"),
    staffNote: formData.get("staffNote") ?? "",
  });

  const t = await prisma.ticket.findUnique({ where: { id: parsed.id } });
  if (!t) throw new Error("回数券が見つかりません");
  if (t.usedCount >= t.totalCount) {
    throw new Error("この回数券はすでに使い切りです");
  }
  if (t.expiresAt && t.expiresAt.getTime() < Date.now()) {
    throw new Error("この回数券は有効期限切れです");
  }

  await prisma.$transaction([
    prisma.ticket.update({
      where: { id: t.id },
      data: { usedCount: { increment: 1 } },
    }),
    prisma.ticketLog.create({
      data: {
        ticketId: t.id,
        action: "use",
        staffNote: parsed.staffNote || null,
      },
    }),
  ]);

  revalidatePath("/admin/tickets");
  revalidatePath(`/admin/tickets/${t.id}`);
  revalidatePath(`/tickets/${t.token}`);
}

export async function cancelLastUseAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;

  const t = await prisma.ticket.findUnique({ where: { id } });
  if (!t) throw new Error("回数券が見つかりません");
  if (t.usedCount <= 0) throw new Error("消化済み回数がありません");

  await prisma.$transaction([
    prisma.ticket.update({
      where: { id: t.id },
      data: { usedCount: { decrement: 1 } },
    }),
    prisma.ticketLog.create({
      data: {
        ticketId: t.id,
        action: "cancel",
        staffNote: "直前の消化を取り消し",
      },
    }),
  ]);

  revalidatePath("/admin/tickets");
  revalidatePath(`/admin/tickets/${t.id}`);
  revalidatePath(`/tickets/${t.token}`);
}

export async function deleteTicketAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  await prisma.ticket.delete({ where: { id } });
  revalidatePath("/admin/tickets");
  redirect("/admin/tickets");
}
