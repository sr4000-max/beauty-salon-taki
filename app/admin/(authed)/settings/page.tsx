import { prisma } from "@/lib/prisma";
import { minToTimeStr } from "@/lib/time";
import {
  updateBusinessHoursAction,
  updateStoreAction,
} from "@/lib/actions/store";

const DOW = ["日曜", "月曜", "火曜", "水曜", "木曜", "金曜", "土曜"];

export default async function StoreSettingsPage() {
  let store = await prisma.store.findFirst({
    include: { businessHours: { orderBy: { dayOfWeek: "asc" } } },
  });
  if (!store) {
    store = await prisma.store.create({
      data: {
        name: "サロン サンプル",
        slotMinutes: 30,
        businessHours: {
          create: Array.from({ length: 7 }, (_, dow) => ({
            dayOfWeek: dow,
            isClosed: dow === 1,
            openMin: 600,
            closeMin: 1140,
          })),
        },
      },
      include: { businessHours: { orderBy: { dayOfWeek: "asc" } } },
    });
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">店舗設定</h1>

      <section className="bg-white border border-stone-200 rounded p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">基本情報</h2>
        <form action={updateStoreAction} className="space-y-4">
          <input type="hidden" name="id" value={store.id} />
          <Field label="店舗名" required>
            <input
              name="name"
              defaultValue={store.name}
              className="w-full border border-stone-300 rounded px-3 py-2"
              required
            />
          </Field>
          <Field label="電話番号">
            <input
              name="phone"
              defaultValue={store.phone ?? ""}
              className="w-full border border-stone-300 rounded px-3 py-2"
            />
          </Field>
          <Field label="住所">
            <input
              name="address"
              defaultValue={store.address ?? ""}
              className="w-full border border-stone-300 rounded px-3 py-2"
            />
          </Field>
          <Field label="管理者通知メール">
            <input
              type="email"
              name="adminEmail"
              defaultValue={store.adminEmail ?? ""}
              placeholder="manager@example.com"
              className="w-full border border-stone-300 rounded px-3 py-2"
            />
            <p className="text-xs text-stone-500 mt-1">
              新規予約が入った時にこのアドレス宛に通知が送られます。空欄なら通知なし。
            </p>
          </Field>
          <Field label="予約スロット間隔(分)" required>
            <select
              name="slotMinutes"
              defaultValue={store.slotMinutes}
              className="border border-stone-300 rounded px-3 py-2"
            >
              {[15, 30, 60].map((n) => (
                <option key={n} value={n}>
                  {n}分
                </option>
              ))}
            </select>
          </Field>
          <button
            type="submit"
            className="bg-stone-900 hover:bg-stone-800 text-white font-medium px-5 py-2 rounded"
          >
            保存
          </button>
        </form>
      </section>

      <section className="bg-white border border-stone-200 rounded p-6">
        <h2 className="text-lg font-bold mb-4">営業時間</h2>
        <form action={updateBusinessHoursAction} className="space-y-3">
          <input type="hidden" name="storeId" value={store.id} />
          {Array.from({ length: 7 }, (_, dow) => {
            const bh =
              store.businessHours.find((b) => b.dayOfWeek === dow) ?? null;
            return (
              <div
                key={dow}
                className="grid grid-cols-[5rem_auto_1fr] sm:grid-cols-[5rem_auto_auto_auto_auto] items-center gap-2 sm:gap-3 py-1"
              >
                <div className="font-medium">{DOW[dow]}</div>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    name={`closed_${dow}`}
                    defaultChecked={bh?.isClosed ?? false}
                  />
                  定休
                </label>
                <input
                  type="time"
                  name={`open_${dow}`}
                  defaultValue={minToTimeStr(bh?.openMin ?? 600)}
                  className="border border-stone-300 rounded px-2 py-1"
                />
                <span>〜</span>
                <input
                  type="time"
                  name={`close_${dow}`}
                  defaultValue={minToTimeStr(bh?.closeMin ?? 1140)}
                  className="border border-stone-300 rounded px-2 py-1"
                />
              </div>
            );
          })}
          <button
            type="submit"
            className="mt-4 bg-stone-900 hover:bg-stone-800 text-white font-medium px-5 py-2 rounded"
          >
            営業時間を保存
          </button>
        </form>
      </section>
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
      <label className="block text-sm font-medium text-stone-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
