import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateAdminReservationAction } from "@/lib/actions/reservation";
import { dateToYmd, getJstHm } from "@/lib/time";

export default async function EditReservationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const reservationId = Number(id);

  const [reservation, menus, staff] = await Promise.all([
    prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        extras: { include: { menu: true }, orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.menu.findMany({
      orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
    }),
    prisma.staff.findMany({
      orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
    }),
  ]);

  if (!reservation) notFound();

  const extraIdSet = new Set(reservation.extras.map((e) => e.menuId));

  async function update(formData: FormData) {
    "use server";
    const r = await updateAdminReservationAction(formData);
    if (r?.error) {
      redirect(
        `/admin/reservations/${reservationId}/edit?error=${encodeURIComponent(r.error)}`,
      );
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <Link
        href={`/admin/reservations/${reservationId}`}
        className="text-sm text-stone-600 hover:underline"
      >
        ← 予約詳細へ戻る
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">
        予約 #{reservation.id} を編集
      </h1>

      {sp.error && (
        <p className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {sp.error}
        </p>
      )}

      <form
        action={update}
        className="bg-white border border-stone-200 rounded p-6 space-y-4"
      >
        <input type="hidden" name="id" value={reservation.id} />

        <Field label="メインメニュー" required>
          <select
            name="menuId"
            required
            defaultValue={reservation.menuId}
            className="w-full border border-stone-300 rounded px-3 py-2"
          >
            {menus.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}（{m.durationMinutes}分 / ¥{m.priceYen.toLocaleString()}）
                {!m.active && " [非公開]"}
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
                <input
                  type="checkbox"
                  name="extraMenuIds"
                  value={m.id}
                  defaultChecked={extraIdSet.has(m.id)}
                />
                <span>
                  {m.name}{" "}
                  <span className="text-xs text-stone-500">
                    {m.durationMinutes}分 / ¥{m.priceYen.toLocaleString()}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </Field>
        <Field label="担当スタッフ" required>
          <select
            name="staffId"
            required
            defaultValue={reservation.staffId ?? undefined}
            className="w-full border border-stone-300 rounded px-3 py-2"
          >
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {!s.active && " [無効]"}
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
              defaultValue={dateToYmd(reservation.startAt)}
              className="w-full border border-stone-300 rounded px-3 py-2"
            />
          </Field>
          <Field label="開始時刻" required>
            <input
              type="time"
              name="startTime"
              required
              defaultValue={getJstHm(reservation.startAt)}
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
            defaultValue={reservation.customerName}
            className="w-full border border-stone-300 rounded px-3 py-2"
          />
        </Field>
        <Field label="フリガナ">
          <input
            name="customerKana"
            maxLength={50}
            defaultValue={reservation.customerKana ?? ""}
            className="w-full border border-stone-300 rounded px-3 py-2"
          />
        </Field>
        <Field label="電話番号" required>
          <input
            type="tel"
            name="customerPhone"
            required
            maxLength={20}
            defaultValue={reservation.customerPhone}
            className="w-full border border-stone-300 rounded px-3 py-2"
          />
        </Field>
        <Field label="メール">
          <input
            type="email"
            name="customerEmail"
            maxLength={100}
            defaultValue={reservation.customerEmail ?? ""}
            className="w-full border border-stone-300 rounded px-3 py-2"
          />
        </Field>
        <Field label="メモ">
          <textarea
            name="notes"
            rows={2}
            defaultValue={reservation.notes ?? ""}
            className="w-full border border-stone-300 rounded px-3 py-2"
          />
        </Field>
        <Field label="">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="force" />
            営業時間外・重複でも強制更新する
          </label>
        </Field>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="bg-stone-900 hover:bg-stone-800 text-white font-medium px-5 py-2 rounded"
          >
            保存
          </button>
          <Link
            href={`/admin/reservations/${reservationId}`}
            className="border border-stone-300 hover:bg-stone-100 px-5 py-2 rounded"
          >
            キャンセル
          </Link>
        </div>
      </form>

      <p className="text-xs text-stone-500 mt-3">
        ※ 予約変更のお客様への通知メールは送信されません。必要に応じて直接ご連絡ください。
      </p>
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
