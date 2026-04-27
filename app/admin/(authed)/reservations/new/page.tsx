import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createAdminReservationAction } from "@/lib/actions/reservation";
import { dateToYmd, startOfDay } from "@/lib/time";

export default async function NewAdminReservationPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    date?: string;
    time?: string;
    staffId?: string;
  }>;
}) {
  const sp = await searchParams;
  const [menus, staff] = await Promise.all([
    prisma.menu.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
    prisma.staff.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
  ]);

  if (menus.length === 0 || staff.length === 0) {
    return (
      <div className="max-w-xl mx-auto bg-amber-50 border border-amber-200 rounded p-6">
        予約を作成する前に、メニューとスタッフを登録してください。
        <div className="mt-3 flex gap-3">
          {menus.length === 0 && (
            <Link
              href="/admin/menus/new"
              className="bg-stone-900 text-white px-4 py-1.5 rounded text-sm"
            >
              メニュー追加
            </Link>
          )}
          {staff.length === 0 && (
            <Link
              href="/admin/staff/new"
              className="bg-stone-900 text-white px-4 py-1.5 rounded text-sm"
            >
              スタッフ追加
            </Link>
          )}
        </div>
      </div>
    );
  }

  async function create(formData: FormData) {
    "use server";
    const r = await createAdminReservationAction(formData);
    if (r?.error) {
      const params = new URLSearchParams();
      params.set("error", r.error);
      redirect(`/admin/reservations/new?${params.toString()}`);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">新規予約（電話受付など）</h1>
      {sp.error && (
        <p className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {sp.error}
        </p>
      )}
      <form
        action={create}
        className="bg-white border border-stone-200 rounded p-6 space-y-4"
      >
        <Field label="メインメニュー" required>
          <select
            name="menuId"
            required
            className="w-full border border-stone-300 rounded px-3 py-2"
          >
            {menus.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}（{m.durationMinutes}分 / ¥{m.priceYen.toLocaleString()}）
              </option>
            ))}
          </select>
        </Field>
        <Field label="追加メニュー（複数選択可）">
          <div className="border border-stone-300 rounded p-3 max-h-56 overflow-y-auto space-y-1">
            {menus.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-2 text-sm hover:bg-stone-50 px-1.5 py-1 rounded"
              >
                <input type="checkbox" name="extraMenuIds" value={m.id} />
                <span>
                  {m.name}{" "}
                  <span className="text-xs text-stone-500">
                    {m.durationMinutes}分 / ¥{m.priceYen.toLocaleString()}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            メインメニューに加えて施術するメニューを選択してください（合計の所要時間で予約を確保します）。
          </p>
        </Field>
        <Field label="担当スタッフ" required>
          <select
            name="staffId"
            required
            defaultValue={sp.staffId}
            className="w-full border border-stone-300 rounded px-3 py-2"
          >
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="日付" required>
            <input
              type="date"
              name="date"
              required
              defaultValue={sp.date ?? dateToYmd(startOfDay(new Date()))}
              className="w-full border border-stone-300 rounded px-3 py-2"
            />
          </Field>
          <Field label="開始時刻" required>
            <input
              type="time"
              name="startTime"
              required
              defaultValue={sp.time ?? "10:00"}
              className="w-full border border-stone-300 rounded px-3 py-2"
            />
          </Field>
        </div>

        <hr className="border-stone-200" />

        <Field label="お客様氏名" required>
          <input
            name="customerName"
            required
            maxLength={50}
            className="w-full border border-stone-300 rounded px-3 py-2"
          />
        </Field>
        <Field label="フリガナ">
          <input
            name="customerKana"
            maxLength={50}
            className="w-full border border-stone-300 rounded px-3 py-2"
          />
        </Field>
        <Field label="電話番号" required>
          <input
            type="tel"
            name="customerPhone"
            required
            maxLength={20}
            className="w-full border border-stone-300 rounded px-3 py-2"
          />
        </Field>
        <Field label="メール（任意）">
          <input
            type="email"
            name="customerEmail"
            maxLength={100}
            className="w-full border border-stone-300 rounded px-3 py-2"
          />
        </Field>
        <Field label="メモ">
          <textarea
            name="notes"
            rows={2}
            className="w-full border border-stone-300 rounded px-3 py-2"
          />
        </Field>
        <Field label="">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="force" />
            営業時間外・重複でも強制登録する
          </label>
        </Field>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="bg-stone-900 hover:bg-stone-800 text-white font-medium px-5 py-2 rounded"
          >
            登録
          </button>
          <Link
            href="/admin/reservations"
            className="border border-stone-300 hover:bg-stone-100 px-5 py-2 rounded"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-stone-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
    </div>
  );
}
