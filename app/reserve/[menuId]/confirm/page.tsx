import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  confirmReservationAction,
  getPendingReservation,
} from "@/lib/actions/reservation";
import {
  formatJpDateLong,
  minToTimeStr,
  ymdToDate,
} from "@/lib/time";
import { SiteHeader } from "../../../_components/SiteHeader";
import { SiteFooter } from "../../../_components/SiteFooter";

export const metadata = { title: "予約内容を確認｜Beauty Salon TAKI" };

export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ menuId: string }>;
  searchParams: Promise<{ error?: string; addons?: string }>;
}) {
  const { menuId } = await params;
  const sp = await searchParams;
  const primaryId = Number(menuId);

  const pending = await getPendingReservation();
  if (!pending || pending.menuIds[0] !== primaryId) {
    redirect(`/reserve/${primaryId}`);
  }

  const menus = await prisma.menu.findMany({
    where: { id: { in: pending.menuIds } },
  });
  if (menus.length === 0) redirect("/menus");

  const orderedMenus = pending.menuIds
    .map((id) => menus.find((m) => m.id === id))
    .filter((m): m is (typeof menus)[number] => !!m);
  const totalDuration = orderedMenus.reduce(
    (s, m) => s + m.durationMinutes,
    0,
  );
  const totalPrice = orderedMenus.reduce((s, m) => s + m.priceYen, 0);

  const staff = pending.staffId
    ? await prisma.staff.findUnique({ where: { id: pending.staffId } })
    : null;

  async function confirm() {
    "use server";
    const r = await confirmReservationAction();
    if (r?.error) {
      const q = sp.addons ? `&addons=${sp.addons}` : "";
      redirect(
        `/reserve/${primaryId}/confirm?error=${encodeURIComponent(r.error)}${q}`,
      );
    }
  }

  const addons = pending.menuIds.slice(1);
  const addonQuery = addons.length ? `&addons=${addons.join(",")}` : "";
  const addonsForBack = addons.length ? `?addons=${addons.join(",")}` : "";

  return (
    <>
      <SiteHeader active="reservation" />

      <section className="page-head">
        <div className="page-head-inner">
          <p className="section-en">Confirmation</p>
          <h1 className="page-title">ご予約内容のご確認</h1>
          <p className="page-desc">以下の内容で予約を承ります。</p>
        </div>
      </section>

      <section className="section">
        <div className="container container-narrow">
          {sp.error && (
            <p className="mb-4 p-4 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm">
              {sp.error}
            </p>
          )}

          <div className="bg-white border border-[var(--color-line)] rounded-sm p-6 mb-6 space-y-5 text-sm">
            <div>
              <h3 className="font-[var(--font-jp-serif)] font-medium mb-3">
                ご予約メニュー（{orderedMenus.length}件）
              </h3>
              <ul className="space-y-1.5">
                {orderedMenus.map((m) => (
                  <li
                    key={m.id}
                    className="flex justify-between items-baseline"
                  >
                    <span>
                      {m.name}{" "}
                      <span className="text-xs text-[color:var(--color-text-light)] ml-1">
                        {m.durationMinutes}分
                      </span>
                    </span>
                    <span className="text-[color:var(--color-text-light)]">
                      ¥{m.priceYen.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-dashed border-[var(--color-line)] mt-3 pt-2 flex justify-between font-[var(--font-jp-serif)]">
                <span>合計</span>
                <span>
                  ¥{totalPrice.toLocaleString()}（税込）{" "}
                  <span className="text-xs text-[color:var(--color-text-light)] ml-2">
                    / 約{totalDuration}分
                  </span>
                </span>
              </div>
            </div>
            <hr className="border-[var(--color-line)]" />
            <div>
              <h3 className="font-[var(--font-jp-serif)] font-medium mb-3">日時 / 担当</h3>
              <dl className="space-y-2">
                <Row
                  label="日時"
                  value={`${formatJpDateLong(ymdToDate(pending.date))} ${minToTimeStr(pending.startMin)}〜${minToTimeStr(pending.startMin + totalDuration)}`}
                />
                <Row label="担当" value={staff ? staff.name : "—"} />
              </dl>
            </div>
            <hr className="border-[var(--color-line)]" />
            <div>
              <h3 className="font-[var(--font-jp-serif)] font-medium mb-3">お客様情報</h3>
              <dl className="space-y-2">
                <Row label="お名前" value={pending.customerName} />
                {pending.customerKana && (
                  <Row label="フリガナ" value={pending.customerKana} />
                )}
                <Row label="電話番号" value={pending.customerPhone} />
                {pending.customerEmail && (
                  <Row label="メール" value={pending.customerEmail} />
                )}
                {pending.notes && <Row label="ご要望" value={pending.notes} />}
              </dl>
            </div>
          </div>

          <form action={confirm}>
            <button type="submit" className="btn-primary btn-full">
              この内容で予約する
            </button>
          </form>

          <div className="text-center mt-4">
            <Link
              href={`/reserve/${primaryId}/form?date=${pending.date}&start=${pending.startMin}&staff=${pending.staffId ?? "any"}${addonQuery}`}
              className="text-xs text-[color:var(--color-accent)] hover:underline"
            >
              入力内容を修正する
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <dt className="w-24 text-[color:var(--color-text-light)] shrink-0">{label}</dt>
      <dd className="flex-1 break-all">{value}</dd>
    </div>
  );
}
