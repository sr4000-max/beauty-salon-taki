"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const menuInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  priceYen: z.coerce.number().int().min(0).max(1_000_000),
  durationMinutes: z.coerce.number().int().min(5).max(600),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
  categoryId: z
    .union([z.coerce.number().int().positive(), z.literal(""), z.null()])
    .transform((v) => (v === "" || v == null ? null : Number(v))),
});

function readForm(formData: FormData) {
  return menuInputSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    priceYen: formData.get("priceYen"),
    durationMinutes: formData.get("durationMinutes"),
    active: formData.get("active") === "on",
    sortOrder: formData.get("sortOrder") || 0,
    categoryId: formData.get("categoryId") ?? "",
  });
}

export async function createMenuAction(formData: FormData) {
  await requireAdmin();
  const data = readForm(formData);
  await prisma.menu.create({
    data: {
      name: data.name,
      description: data.description || null,
      priceYen: data.priceYen,
      durationMinutes: data.durationMinutes,
      active: data.active,
      sortOrder: data.sortOrder,
      categoryId: data.categoryId,
    },
  });
  revalidatePath("/admin/menus");
  revalidatePath("/menus");
  redirect("/admin/menus");
}

export async function updateMenuAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const data = readForm(formData);
  await prisma.menu.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      priceYen: data.priceYen,
      durationMinutes: data.durationMinutes,
      active: data.active,
      sortOrder: data.sortOrder,
      categoryId: data.categoryId,
    },
  });
  revalidatePath("/admin/menus");
  revalidatePath("/menus");
  redirect("/admin/menus");
}

export async function deleteMenuAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const used = await prisma.reservation.count({ where: { menuId: id } });
  if (used > 0) {
    await prisma.menu.update({ where: { id }, data: { active: false } });
  } else {
    await prisma.menu.delete({ where: { id } });
  }
  revalidatePath("/admin/menus");
  revalidatePath("/menus");
}
