"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const staffInputSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#94a3b8"),
  workDays: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

function readForm(formData: FormData) {
  const workDays = formData.getAll("workDays").map(String);
  return staffInputSchema.parse({
    name: formData.get("name"),
    color: formData.get("color") || "#94a3b8",
    workDays,
    active: formData.get("active") === "on",
    sortOrder: formData.get("sortOrder") || 0,
  });
}

export async function createStaffAction(formData: FormData) {
  await requireAdmin();
  const data = readForm(formData);
  await prisma.staff.create({
    data: {
      name: data.name,
      color: data.color,
      workDays: data.workDays.join(","),
      active: data.active,
      sortOrder: data.sortOrder,
    },
  });
  revalidatePath("/admin/staff");
  redirect("/admin/staff");
}

export async function updateStaffAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const data = readForm(formData);
  await prisma.staff.update({
    where: { id },
    data: {
      name: data.name,
      color: data.color,
      workDays: data.workDays.join(","),
      active: data.active,
      sortOrder: data.sortOrder,
    },
  });
  revalidatePath("/admin/staff");
  redirect("/admin/staff");
}

export async function deleteStaffAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const reservationCount = await prisma.reservation.count({
    where: { staffId: id, status: "BOOKED" },
  });
  if (reservationCount > 0) {
    await prisma.staff.update({
      where: { id },
      data: { active: false },
    });
  } else {
    await prisma.staff.delete({ where: { id } });
  }
  revalidatePath("/admin/staff");
}
