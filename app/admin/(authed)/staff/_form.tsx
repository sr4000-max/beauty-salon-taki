import Link from "next/link";

const DOW = [
  { v: "0", l: "日" },
  { v: "1", l: "月" },
  { v: "2", l: "火" },
  { v: "3", l: "水" },
  { v: "4", l: "木" },
  { v: "5", l: "金" },
  { v: "6", l: "土" },
];

export type StaffFormDefaults = {
  id?: number;
  name?: string;
  color?: string;
  workDays?: string;
  active?: boolean;
  sortOrder?: number;
};

export function StaffForm({
  action,
  defaults = {},
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults?: StaffFormDefaults;
  submitLabel: string;
}) {
  const selectedDays = (defaults.workDays ?? "1,2,3,4,5,6").split(",").filter(Boolean);
  return (
    <form action={action} className="bg-white border border-stone-200 rounded p-6 max-w-xl mx-auto space-y-4">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      <Field label="名前" required>
        <input
          name="name"
          required
          defaultValue={defaults.name ?? ""}
          maxLength={50}
          className="w-full border border-stone-300 rounded px-3 py-2"
        />
      </Field>
      <Field label="カラー（カレンダー表示用）">
        <input
          name="color"
          type="color"
          defaultValue={defaults.color ?? "#94a3b8"}
          className="border border-stone-300 rounded h-10 w-20"
        />
      </Field>
      <Field label="勤務曜日">
        <div className="flex gap-2 flex-wrap">
          {DOW.map((d) => (
            <label key={d.v} className="flex items-center gap-1 px-3 py-1.5 border border-stone-300 rounded cursor-pointer hover:bg-stone-50 has-checked:bg-rose-50 has-checked:border-rose-400">
              <input
                type="checkbox"
                name="workDays"
                value={d.v}
                defaultChecked={selectedDays.includes(d.v)}
              />
              {d.l}
            </label>
          ))}
        </div>
      </Field>
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
          有効
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
          href="/admin/staff"
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
