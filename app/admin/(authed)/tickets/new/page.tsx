import Link from "next/link";
import { createTicketAction } from "@/lib/actions/ticket";

export default function NewTicketPage() {
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">回数券を発行</h1>

      <form
        action={createTicketAction}
        className="bg-white border border-stone-200 rounded p-6 space-y-5"
      >
        <Field label="お客様名" required>
          <input
            name="customerName"
            required
            maxLength={50}
            className="w-full border border-stone-300 rounded px-3 py-2"
            placeholder="山田 花子"
          />
        </Field>

        <Field label="施術種別" required>
          <input
            name="treatment"
            required
            maxLength={100}
            className="w-full border border-stone-300 rounded px-3 py-2"
            placeholder="例: 全身脱毛 / VIO脱毛 / フェイシャル"
          />
          <p className="text-xs text-stone-500 mt-1">
            お客様の回数券ページ・QRに表示されます
          </p>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="購入回数" required>
            <input
              type="number"
              name="totalCount"
              required
              min={1}
              max={999}
              defaultValue={5}
              className="w-full border border-stone-300 rounded px-3 py-2"
            />
          </Field>
          <Field label="有効期限">
            <input
              type="date"
              name="expiresAt"
              className="w-full border border-stone-300 rounded px-3 py-2"
            />
            <p className="text-xs text-stone-500 mt-1">空欄 = 無期限</p>
          </Field>
        </div>

        <Field label="メモ（任意）">
          <textarea
            name="note"
            rows={3}
            maxLength={500}
            className="w-full border border-stone-300 rounded px-3 py-2"
            placeholder="社内向け備考。お客様には表示されません"
          />
        </Field>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="bg-stone-900 hover:bg-stone-800 text-white font-medium px-5 py-2 rounded"
          >
            発行する
          </button>
          <Link
            href="/admin/tickets"
            className="border border-stone-300 hover:bg-stone-100 px-5 py-2 rounded"
          >
            キャンセル
          </Link>
        </div>
      </form>

      <p className="text-xs text-stone-500 mt-4">
        ※ 発行後の画面で QR コードを表示・印刷できます
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
      <label className="block text-sm font-medium text-stone-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
