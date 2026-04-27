import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCategoryAction } from "@/lib/actions/category";
import { CategoryForm } from "../_form";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await prisma.menuCategory.findUnique({ where: { id: Number(id) } });
  if (!c) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">カテゴリを編集</h1>
      <CategoryForm
        action={updateCategoryAction}
        submitLabel="保存"
        defaults={{ id: c.id, name: c.name, sortOrder: c.sortOrder }}
      />
    </div>
  );
}
