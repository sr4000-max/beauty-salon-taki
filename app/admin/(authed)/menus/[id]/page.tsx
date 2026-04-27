import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateMenuAction } from "@/lib/actions/menu";
import { MenuForm } from "../_form";

export default async function EditMenuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [menu, categories] = await Promise.all([
    prisma.menu.findUnique({ where: { id: Number(id) } }),
    prisma.menuCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
  ]);
  if (!menu) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">メニューを編集</h1>
      <MenuForm
        action={updateMenuAction}
        submitLabel="保存"
        categories={categories}
        defaults={{
          id: menu.id,
          name: menu.name,
          description: menu.description,
          priceYen: menu.priceYen,
          durationMinutes: menu.durationMinutes,
          active: menu.active,
          sortOrder: menu.sortOrder,
          categoryId: menu.categoryId,
        }}
      />
    </div>
  );
}
