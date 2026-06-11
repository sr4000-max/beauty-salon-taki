import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";

const NAV = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/calendar", label: "カレンダー" },
  { href: "/admin/reservations", label: "予約一覧" },
  { href: "/admin/reservations/new", label: "新規予約" },
  { href: "/admin/tickets", label: "回数券" },
  { href: "/admin/staff", label: "スタッフ" },
  { href: "/admin/categories", label: "カテゴリ" },
  { href: "/admin/menus", label: "メニュー" },
  { href: "/admin/settings", label: "店舗設定" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      <header className="bg-stone-900 text-stone-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-3 flex items-center gap-4 flex-wrap">
          <Link href="/admin" className="font-bold text-lg mr-2">
            管理画面
          </Link>
          <nav className="flex gap-1 flex-wrap text-sm">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="px-3 py-1.5 rounded hover:bg-stone-800 transition"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <form action={logoutAction} className="ml-auto">
            <button
              type="submit"
              className="text-sm text-stone-300 hover:text-white px-3 py-1.5"
            >
              ログアウト
            </button>
          </form>
        </div>
      </header>
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-10 lg:px-16 py-6">
        {children}
      </div>
    </div>
  );
}
