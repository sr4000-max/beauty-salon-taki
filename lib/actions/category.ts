"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const inputSchema = z.object({
  name: z.string().min(1).max(50),
  sortOrder: z.coerce.number().int().default(0),
});

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const data = inputSchema.parse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  await prisma.menuCategory.create({ data });
  revalidatePath("/admin/categories");
  revalidatePath("/menus");
  redirect("/admin/categories");
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const data = inputSchema.parse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  await prisma.menuCategory.update({ where: { id }, data });
  revalidatePath("/admin/categories");
  revalidatePath("/menus");
  redirect("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await prisma.menuCategory.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/admin/menus");
  revalidatePath("/menus");
}
