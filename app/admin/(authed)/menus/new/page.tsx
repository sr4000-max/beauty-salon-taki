import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createMenuAction } from "@/lib/actions/menu";
import { MenuForm } from "../_form";

export default async function NewMenuPage() {
  const categories = await prisma.menuCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">メニューを追加</h1>
      {categories.length === 0 && (
        <p className="bg-amber-50 border border-amber-200 rounded p-3 mb-4 text-sm">
          まだカテゴリがありません。
          <Link href="/admin/categories" className="underline font-medium ml-1">
            カテゴリを管理
          </Link>
          から先に追加すると整理しやすいです。
        </p>
      )}
      <MenuForm
        action={createMenuAction}
        submitLabel="登録"
        categories={categories}
      />
    </div>
  );
}
