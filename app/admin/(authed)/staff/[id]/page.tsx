import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateStaffAction } from "@/lib/actions/staff";
import { StaffForm } from "../_form";

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const staff = await prisma.staff.findUnique({ where: { id: Number(id) } });
  if (!staff) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">スタッフを編集</h1>
      <StaffForm
        action={updateStaffAction}
        submitLabel="保存"
        defaults={{
          id: staff.id,
          name: staff.name,
          color: staff.color,
          workDays: staff.workDays,
          active: staff.active,
          sortOrder: staff.sortOrder,
        }}
      />
    </div>
  );
}
