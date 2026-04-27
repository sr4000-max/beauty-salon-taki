import Link from "next/link";

export type MenuFormDefaults = {
  id?: number;
  name?: string;
  description?: string | null;
  priceYen?: number;
  durationMinutes?: number;
  active?: boolean;
  sortOrder?: number;
  categoryId?: number | null;
};

export type CategoryOption = { id: number; name: string };

export function MenuForm({
  action,
  defaults = {},
  submitLabel,
  categories,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults?: MenuFormDefaults;
  submitLabel: string;
  categories: CategoryOption[];
}) {
  return (
    <form action={action} className="bg-white border border-stone-200 rounded p-6 max-w-xl mx-auto space-y-4">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      <Field label="カテゴリ">
        <select
          name="categoryId"
          defaultValue={defaults.categoryId ?? ""}
          className="w-full border border-stone-300 rounded px-3 py-2"
        >
          <option value="">— 未分類 —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="メニュー名" required>
        <input
          name="name"
          required
          defaultValue={defaults.name ?? ""}
          className="w-full border border-stone-300 rounded px-3 py-2"
        />
      </Field>
      <Field label="説明">
        <textarea
          name="description"
          rows={3}
          defaultValue={defaults.description ?? ""}
          className="w-full border border-stone-300 rounded px-3 py-2"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="料金（円）" required>
          <input
            type="number"
            name="priceYen"
            min={0}
            required
            defaultValue={defaults.priceYen ?? 0}
            className="w-full border border-stone-300 rounded px-3 py-2"
          />
        </Field>
        <Field label="所要時間（分）" required>
          <input
            type="number"
            name="durationMinutes"
            min={5}
            step={5}
            required
            defaultValue={defaults.durationMinutes ?? 60}
            className="w-full border border-stone-300 rounded px-3 py-2"
          />
        </Field>
      </div>
      <Field label="表示順">
        <input
          type="number"
          name="sortOrder"
          defaultValue={defaults.sortOrder ?? 0}
          className="w-32 border border-stone-300 rounded px-3 py-2"
        />
      </Field>
      <Field label="">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="active"
            defaultChecked={defaults.active ?? true}
          />
          公開する
        </label>
      </Field>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="bg-stone-900 hover:bg-stone-800 text-white font-medium px-5 py-2 rounded"
        >
          {submitLabel}
        </button>
        <Link
          href="/admin/menus"
          className="border border-stone-300 hover:bg-stone-100 px-5 py-2 rounded"
        >
          キャンセル
        </Link>
      </div>
    </form>
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
