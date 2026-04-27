"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ymdToDate } from "@/lib/time";

export async function toggleHolidayAction(formData: FormData) {
  await requireAdmin();
  const ymd = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return;
  const date = ymdToDate(ymd);
  const existing = await prisma.holiday.findUnique({ where: { date } });
  if (existing) {
    await prisma.holiday.delete({ where: { id: existing.id } });
  } else {
    await prisma.holiday.create({
      data: { date, note: String(formData.get("note") ?? "") || null },
    });
  }
  revalidatePath("/admin/calendar");
  revalidatePath("/menus");
}
