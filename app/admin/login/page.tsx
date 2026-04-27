import { loginAction } from "@/lib/actions/auth";
import { isAdminAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "管理ログイン" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdminAuthed()) redirect("/admin");
  const sp = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const r = await loginAction(formData);
    if (r?.error) {
      redirect("/admin/login?error=" + encodeURIComponent(r.error));
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <form
        action={login}
        className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-stone-200 p-6"
      >
        <h1 className="text-xl font-bold mb-1">管理ログイン</h1>
        <p className="text-sm text-stone-500 mb-6">
          管理者パスワードを入力してください
        </p>
        {sp.error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {sp.error}
          </p>
        )}
        <label className="block text-sm font-medium text-stone-700 mb-1">
          パスワード
        </label>
        <input
          name="password"
          type="password"
          required
          autoFocus
          className="w-full border border-stone-300 rounded px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-rose-400"
        />
        <button
          type="submit"
          className="w-full bg-stone-900 hover:bg-stone-800 text-white font-medium py-2 rounded transition"
        >
          ログイン
        </button>
      </form>
    </main>
  );
}
