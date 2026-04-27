import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateReservationStatusAction } from "@/lib/actions/reservation";
import { formatJpDateLong } from "@/lib/time";

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const r = await prisma.reservation.findUnique({
    where: { id: Number(id) },
    include: {
      menu: true,
      staff: true,
      extras: { include: { menu: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!r) notFound();

  const allMenus = [r.menu, ...r.extras.map((e) => e.menu)];
  const totalPrice = allMenus.reduce((s, m) => s + m.priceYen, 0);
  const totalDuration = allMenus.reduce((s, m) => s + m.durationMinutes, 0);

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/admin/reservations"
        className="text-sm text-stone-600 hover:underline"
      >
        ← 予約一覧へ
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">予約詳細 #{r.id}</h1>

      <div className="bg-white border border-stone-200 rounded p-6 mb-4 space-y-3 text-sm">
        <div>
          <h3 className="font-bold mb-2">メニュー（{allMenus.length}件）</h3>
          <ul className="space-y-1.5 mb-2">
            {allMenus.map((m, i) => (
              <li key={i} className="flex justify-between items-baseline">
                <span>
                  {m.name}{" "}
                  <span className="text-xs text-stone-500 ml-1">
                    {m.durationMinutes}分
                  </span>
                </span>
                <span className="text-stone-600">
                  ¥{m.priceYen.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-dashed border-stone-200 pt-2 flex justify-between font-bold">
            <span>合計</span>
            <span>
              ¥{totalPrice.toLocaleString()}（税込）{" "}
              <span className="text-xs font-normal text-stone-500 ml-2">
                / 約{totalDuration}分
              </span>
            </span>
          </div>
        </div>
        <hr className="border-stone-200" />
        <Section title="日時 / 担当">
          <Row
            label="日時"
            value={`${formatJpDateLong(r.startAt)} ${fmt(r.startAt)}〜${fmt(r.endAt)}`}
          />
          <Row label="担当" value={r.staff?.name ?? "—"} />
          <Row
            label="経路"
            value={r.source === "WEB" ? "WEB予約" : "管理画面登録"}
          />
        </Section>
        <hr className="border-stone-200" />
        <Section title="お客様情報">
          <Row label="お名前" value={r.customerName} />
          {r.customerKana && <Row label="フリガナ" value={r.customerKana} />}
          <Row label="電話番号" value={r.customerPhone} />
          {r.customerEmail && <Row label="メール" value={r.customerEmail} />}
          {r.notes && <Row label="ご要望" value={r.notes} />}
        </Section>
      </div>

      <div className="bg-white border border-stone-200 rounded p-6">
        <h3 className="font-bold mb-3">ステータス変更</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { v: "BOOKED", label: "予約中に戻す", cls: "bg-blue-600 hover:bg-blue-700" },
            { v: "COMPLETED", label: "来店済にする", cls: "bg-green-600 hover:bg-green-700" },
            { v: "CANCELLED", label: "キャンセル", cls: "bg-stone-600 hover:bg-stone-700" },
          ].map((b) => (
            <form key={b.v} action={updateReservationStatusAction}>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="status" value={b.v} />
              <button
                type="submit"
                disabled={r.status === b.v}
                className={`text-white font-medium px-4 py-2 rounded text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${b.cls}`}
              >
                {b.label}
              </button>
            </form>
          ))}
        </div>
        <p className="text-xs text-stone-500 mt-3">
          現在のステータス:{" "}
          <span className="font-medium">
            {r.status === "BOOKED"
              ? "予約中"
              : r.status === "COMPLETED"
                ? "来店済"
                : "キャンセル"}
          </span>
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-bold mb-2">{title}</h3>
      <dl className="space-y-1">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <dt className="w-24 text-stone-500 shrink-0">{label}</dt>
      <dd className="flex-1 break-all">{value}</dd>
    </div>
  );
}

function fmt(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
