import Link from "next/link";

export type CategoryFormDefaults = {
  id?: number;
  name?: string;
  sortOrder?: number;
};

export function CategoryForm({
  action,
  defaults = {},
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults?: CategoryFormDefaults;
  submitLabel: string;
}) {
  return (
    <form
      action={action}
      className="bg-white border border-stone-200 rounded p-6 max-w-md space-y-4"
    >
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          カテゴリ名 <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          required
          maxLength={50}
          defaultValue={defaults.name ?? ""}
          className="w-full border border-stone-300 rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          表示順
        </label>
        <input
          type="number"
          name="sortOrder"
          defaultValue={defaults.sortOrder ?? 0}
          className="w-32 border border-stone-300 rounded px-3 py-2"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="bg-stone-900 hover:bg-stone-800 text-white font-medium px-5 py-2 rounded"
        >
          {submitLabel}
        </button>
        <Link
          href="/admin/categories"
          className="border border-stone-300 hover:bg-stone-100 px-5 py-2 rounded"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
