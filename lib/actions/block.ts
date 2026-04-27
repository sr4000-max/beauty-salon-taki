"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ymdToDate } from "@/lib/time";

const inputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  staffId: z
    .union([z.coerce.number().int().positive(), z.literal(""), z.literal("all")])
    .transform((v) => (v === "" || v === "all" ? null : Number(v))),
  note: z.string().max(200).optional().or(z.literal("")),
});

export async function createBlockAction(formData: FormData) {
  await requireAdmin();
  const data = inputSchema.parse({
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    staffId: formData.get("staffId") ?? "all",
    note: formData.get("note") ?? "",
  });
  const [sh, sm] = data.startTime.split(":").map(Number);
  const [eh, em] = data.endTime.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (endMin <= startMin) return;
  await prisma.block.create({
    data: {
      date: ymdToDate(data.date),
      startMin,
      endMin,
      staffId: data.staffId,
      note: data.note || null,
    },
  });
  revalidatePath("/admin/calendar");
  revalidatePath("/menus");
}

export async function deleteBlockAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await prisma.block.delete({ where: { id } });
  revalidatePath("/admin/calendar");
  revalidatePath("/menus");
}
