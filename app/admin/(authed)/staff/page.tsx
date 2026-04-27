import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteStaffAction } from "@/lib/actions/staff";

const DOW_SHORT = ["日", "月", "火", "水", "木", "金", "土"];

export default async function StaffListPage() {
  const staff = await prisma.staff.findMany({
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">スタッフ</h1>
        <Link
          href="/admin/staff/new"
          className="bg-rose-500 hover:bg-rose-600 text-white font-medium px-4 py-2 rounded"
        >
          ＋ スタッフを追加
        </Link>
      </div>

      {staff.length === 0 ? (
        <p className="bg-white border border-stone-200 rounded p-6 text-center text-stone-500">
          まだスタッフが登録されていません
        </p>
      ) : (
        <div className="bg-white border border-stone-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="text-left px-3 py-2 w-12"></th>
                <th className="text-left px-3 py-2">名前</th>
                <th className="text-left px-3 py-2">勤務曜日</th>
                <th className="text-left px-3 py-2">表示順</th>
                <th className="text-left px-3 py-2">状態</th>
                <th className="text-right px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => {
                const days = s.workDays.split(",").filter(Boolean).map(Number);
                return (
                  <tr key={s.id} className="border-t border-stone-100">
                    <td className="px-3 py-2">
                      <span
                        className="inline-block w-5 h-5 rounded-full"
                        style={{ background: s.color }}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium">{s.name}</td>
                    <td className="px-3 py-2 text-stone-600">
                      {days.length === 7
                        ? "毎日"
                        : days.map((d) => DOW_SHORT[d]).join("・") || "—"}
                    </td>
                    <td className="px-3 py-2">{s.sortOrder}</td>
                    <td className="px-3 py-2">
                      {s.active ? (
                        <span className="text-green-700">有効</span>
                      ) : (
                        <span className="text-stone-400">無効</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/admin/staff/${s.id}`}
                        className="text-stone-700 hover:underline mr-3"
                      >
                        編集
                      </Link>
                      <form
                        action={deleteStaffAction}
                        className="inline"
                      >
                        <input type="hidden" name="id" value={s.id} />
                        <button
                          type="submit"
                          className="text-red-600 hover:underline"
                        >
                          削除
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-stone-500 mt-3">
        ※ 既存予約のあるスタッフを削除しようとすると、自動的に「無効」状態になります。
      </p>
    </div>
  );
}
