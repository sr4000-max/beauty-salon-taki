import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteMenuAction } from "@/lib/actions/menu";

export default async function MenuListPage() {
  const menus = await prisma.menu.findMany({
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
    include: { category: true },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">メニュー</h1>
        <Link
          href="/admin/menus/new"
          className="bg-rose-500 hover:bg-rose-600 text-white font-medium px-4 py-2 rounded"
        >
          ＋ メニューを追加
        </Link>
      </div>

      {menus.length === 0 ? (
        <p className="bg-white border border-stone-200 rounded p-6 text-center text-stone-500">
          まだメニューが登録されていません
        </p>
      ) : (
        <div className="bg-white border border-stone-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="text-left px-3 py-2">カテゴリ</th>
                <th className="text-left px-3 py-2">メニュー名</th>
                <th className="text-left px-3 py-2">料金</th>
                <th className="text-left px-3 py-2">所要時間</th>
                <th className="text-left px-3 py-2">表示順</th>
                <th className="text-left px-3 py-2">状態</th>
                <th className="text-right px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {menus.map((m) => (
                <tr key={m.id} className="border-t border-stone-100">
                  <td className="px-3 py-2 text-stone-600 text-xs">
                    {m.category?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-medium">{m.name}</td>
                  <td className="px-3 py-2">¥{m.priceYen.toLocaleString()}</td>
                  <td className="px-3 py-2">{m.durationMinutes}分</td>
                  <td className="px-3 py-2">{m.sortOrder}</td>
                  <td className="px-3 py-2">
                    {m.active ? (
                      <span className="text-green-700">公開中</span>
                    ) : (
                      <span className="text-stone-400">非公開</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/admin/menus/${m.id}`}
                      className="text-stone-700 hover:underline mr-3"
                    >
                      編集
                    </Link>
                    <form action={deleteMenuAction} className="inline">
                      <input type="hidden" name="id" value={m.id} />
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
        ※ 既に予約のあるメニューを削除しようとすると、自動的に「非公開」状態になります。
      </p>
    </div>
  );
}
