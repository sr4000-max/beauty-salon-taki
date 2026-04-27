import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteCategoryAction } from "@/lib/actions/category";

export default async function CategoryListPage() {
  const categories = await prisma.menuCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { _count: { select: { menus: true } } },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">メニューカテゴリ</h1>
        <Link
          href="/admin/categories/new"
          className="bg-rose-500 hover:bg-rose-600 text-white font-medium px-4 py-2 rounded"
        >
          ＋ カテゴリを追加
        </Link>
      </div>

      {categories.length === 0 ? (
        <p className="bg-white border border-stone-200 rounded p-6 text-center text-stone-500">
          カテゴリがまだありません
        </p>
      ) : (
        <div className="bg-white border border-stone-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="text-left px-3 py-2">名前</th>
                <th className="text-left px-3 py-2">表示順</th>
                <th className="text-left px-3 py-2">所属メニュー</th>
                <th className="text-right px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t border-stone-100">
                  <td className="px-3 py-2 font-medium">{c.name}</td>
                  <td className="px-3 py-2">{c.sortOrder}</td>
                  <td className="px-3 py-2 text-stone-600">
                    {c._count.menus}件
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/admin/categories/${c.id}`}
                      className="text-stone-700 hover:underline mr-3"
                    >
                      編集
                    </Link>
                    <form action={deleteCategoryAction} className="inline">
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="text-red-600 hover:underline"
                      >
                        削除
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-stone-500 mt-3">
        ※ カテゴリを削除すると、所属メニューは「未分類」になります。
      </p>
    </div>
  );
}
