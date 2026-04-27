"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const storeSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().min(1).max(100),
  phone: z.string().max(40).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  adminEmail: z
    .string()
    .email()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  slotMinutes: z.coerce.number().int().min(5).max(120),
});

export async function updateStoreAction(formData: FormData) {
  await requireAdmin();
  const parsed = storeSchema.parse({
    id: formData.get("id"),
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    adminEmail: formData.get("adminEmail") ?? "",
    slotMinutes: formData.get("slotMinutes"),
  });
  await prisma.store.update({
    where: { id: parsed.id },
    data: {
      name: parsed.name,
      phone: parsed.phone || null,
      address: parsed.address || null,
      adminEmail: parsed.adminEmail || null,
      slotMinutes: parsed.slotMinutes,
    },
  });
  revalidatePath("/admin/settings");
  revalidatePath("/");
}

export async function updateBusinessHoursAction(formData: FormData) {
  await requireAdmin();
  const storeId = Number(formData.get("storeId"));
  for (let dow = 0; dow < 7; dow++) {
    const isClosed = formData.get(`closed_${dow}`) === "on";
    const open = String(formData.get(`open_${dow}`) ?? "10:00");
    const close = String(formData.get(`close_${dow}`) ?? "19:00");
    const [oh, om] = open.split(":").map(Number);
    const [ch, cm] = close.split(":").map(Number);
    const openMin = oh * 60 + om;
    const closeMin = ch * 60 + cm;
    await prisma.businessHour.upsert({
      where: { storeId_dayOfWeek: { storeId, dayOfWeek: dow } },
      update: { isClosed, openMin, closeMin },
      create: { storeId, dayOfWeek: dow, isClosed, openMin, closeMin },
    });
  }
  revalidatePath("/admin/settings");
}
