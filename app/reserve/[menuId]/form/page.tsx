import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  combineDateAndMin,
  formatJpDateLong,
  minToTimeStr,
  ymdToDate,
} from "@/lib/time";
import { savePendingFromFormAction } from "@/lib/actions/reservation";
import { isSlotStillFree, parseMenuIds } from "@/lib/availability";
import { SiteHeader } from "../../../_components/SiteHeader";
import { SiteFooter } from "../../../_components/SiteFooter";

export const metadata = { title: "お客様情報入力｜Beauty Salon TAKI" };

export default async function ReserveFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ menuId: string }>;
  searchParams: Promise<{
    date?: string;
    start?: string;
    staff?: string;
    addons?: string;
  }>;
}) {
  const { menuId } = await params;
  const sp = await searchParams;
  const primaryId = Number(menuId);
  if (!sp.date || !sp.start) {
    const addonQuery = sp.addons ? `?addons=${sp.addons}` : "";
    redirect(`/reserve/${primaryId}${addonQuery}`);
  }

  const addonIds = parseMenuIds(sp.addons);
  const menuIds = [primaryId, ...addonIds.filter((n) => n !== primaryId)];

  const menus = await prisma.menu.findMany({
    where: { id: { in: menuIds }, active: true },
  });
  if (menus.length !== menuIds.length || !menus.find((m) => m.id === primaryId))
    notFound();

  const orderedMenus = menuIds
    .map((id) => menus.find((m) => m.id === id))
    .filter((m): m is (typeof menus)[number] => !!m);
  const totalDuration = orderedMenus.reduce(
    (s, m) => s + m.durationMinutes,
    0,
  );
  const totalPrice = orderedMenus.reduce((s, m) => s + m.priceYen, 0);

  const startMin = Number(sp.start);
  const date = sp.date;
  const startAt = combineDateAndMin(date, startMin);
  const endAt = new Date(startAt.getTime() + totalDuration * 60 * 1000);
  const staffId = sp.staff && sp.staff !== "any" ? Number(sp.staff) : null;

  const slot = await isSlotStillFree({
    startAt,
    endAt,
    staffId,
    menuIds,
  });
  if (!slot.ok) {
    return <UnavailableNotice primaryId={primaryId} addons={sp.addons} reason={slot.reason} />;
  }

  const assignedStaff = await prisma.staff.findUnique({
    where: { id: slot.staffId },
  });

  const addonQuery = addonIds.length ? `?addons=${addonIds.join(",")}` : "";

  return (
    <>
      <SiteHeader active="reservation" />

      <section className="page-head">
        <div className="page-head-inner">
          <p className="section-en">Reservation</p>
          <h1 className="page-title">お客様情報の入力</h1>
          <p className="page-desc">必要事項をご入力ください。</p>
        </div>
      </section>

      <section className="section">
        <div className="container container-narrow">
          <div className="bg-white border border-[var(--color-line)] rounded-sm p-5 mb-6">
            <h2 className="font-[var(--font-jp-serif)] font-medium mb-3">
              予約内容
            </h2>
            <ul className="space-y-1.5 text-sm mb-3">
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
            <div className="border-t border-dashed border-[var(--color-line)] pt-2 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-[color:var(--color-text-light)]">日時</span>
                <span>
                  {formatJpDateLong(ymdToDate(date))} {minToTimeStr(startMin)}〜
                  {minToTimeStr(startMin + totalDuration)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[color:var(--color-text-light)]">担当</span>
                <span>{assignedStaff ? assignedStaff.name : "—"}</span>
              </div>
              <div className="flex justify-between font-[var(--font-jp-serif)] pt-1">
                <span>合計</span>
                <span>
                  ¥{totalPrice.toLocaleString()}{" "}
                  <span className="text-xs text-[color:var(--color-text-light)] ml-2">
                    / 約{totalDuration}分
                  </span>
                </span>
              </div>
            </div>
            <Link
              href={`/reserve/${primaryId}${addonQuery}`}
              className="inline-block mt-4 text-xs text-[color:var(--color-accent)] hover:underline"
            >
              ← 日時を選び直す
            </Link>
          </div>

          <form
            action={savePendingFromFormAction}
            className="bg-white border border-[var(--color-line)] rounded-sm p-6 space-y-5"
          >
            <input type="hidden" name="menuIds" value={menuIds.join(",")} />
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="startMin" value={startMin} />
            <input type="hidden" name="staffId" value={String(slot.staffId)} />

            <Field label="お名前" required>
              <input
                name="customerName"
                required
                maxLength={50}
                className="w-full border border-[var(--color-line)] rounded-sm px-3 py-2 focus:outline-none focus:border-[var(--color-accent)]"
                placeholder="山田 花子"
              />
            </Field>
            <Field label="フリガナ">
              <input
                name="customerKana"
                maxLength={50}
                className="w-full border border-[var(--color-line)] rounded-sm px-3 py-2 focus:outline-none focus:border-[var(--color-accent)]"
                placeholder="ヤマダ ハナコ"
              />
            </Field>
            <Field label="電話番号" required>
              <input
                type="tel"
                name="customerPhone"
                required
                maxLength={20}
                className="w-full border border-[var(--color-line)] rounded-sm px-3 py-2 focus:outline-none focus:border-[var(--color-accent)]"
                placeholder="090-0000-0000"
              />
            </Field>
            <Field label="メールアドレス" required>
              <input
                type="email"
                name="customerEmail"
                required
                maxLength={100}
                className="w-full border border-[var(--color-line)] rounded-sm px-3 py-2 focus:outline-none focus:border-[var(--color-accent)]"
                placeholder="example@email.com"
              />
              <p className="text-xs text-[color:var(--color-text-light)] mt-1">
                予約確認メールとキャンセル用URLをお送りします。
              </p>
            </Field>
            <Field label="ご要望（任意）">
              <textarea
                name="notes"
                rows={3}
                maxLength={500}
                className="w-full border border-[var(--color-line)] rounded-sm px-3 py-2 focus:outline-none focus:border-[var(--color-accent)]"
              />
            </Field>
            <button type="submit" className="btn-primary btn-full">
              確認画面へ進む
            </button>
          </form>
        </div>
      </section>

      <SiteFooter />
    </>
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
      <label className="block text-sm font-medium text-[color:var(--color-text)] mb-1.5">
        {label}
        {required && (
          <span className="ml-1 text-xs text-[color:var(--color-accent)]">必須</span>
        )}
      </label>
      {children}
    </div>
  );
}

function UnavailableNotice({
  primaryId,
  addons,
  reason,
}: {
  primaryId: number;
  addons?: string;
  reason: string;
}) {
  const q = addons ? `?addons=${addons}` : "";
  return (
    <>
      <SiteHeader active="reservation" />
      <section className="section">
        <div className="container container-narrow text-center">
          <p className="bg-amber-50 border border-amber-200 rounded p-6 mb-6">
            申し訳ありません。{reason}
          </p>
          <Link href={`/reserve/${primaryId}${q}`} className="btn-primary">
            日時を選び直す
          </Link>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
