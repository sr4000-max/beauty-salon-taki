import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { cancelByTokenAction } from "@/lib/actions/reservation";
import {
  formatJpDateLong,
  getJstHour,
  getJstMinute,
  minToTimeStr,
} from "@/lib/time";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";

type ReservationWithRelations = Prisma.ReservationGetPayload<{
  include: {
    menu: true;
    staff: true;
    extras: { include: { menu: true } };
  };
}>;

export const metadata = { title: "予約キャンセル｜Beauty Salon TAKI" };

export default async function CancelPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;

  const r = await prisma.reservation.findUnique({
    where: { cancelToken: token },
    include: {
      menu: true,
      staff: true,
      extras: { include: { menu: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  async function cancel() {
    "use server";
    const fd = new FormData();
    fd.set("token", token);
    const result = await cancelByTokenAction(fd);
    if (result?.error) {
      redirect(`/cancel/${token}?error=${encodeURIComponent(result.error)}`);
    }
    redirect(`/cancel/${token}?done=1`);
  }

  return (
    <>
      <SiteHeader active="reservation" />

      <section className="page-head">
        <div className="page-head-inner">
          <p className="section-en">Cancel</p>
          <h1 className="page-title">ご予約のキャンセル</h1>
        </div>
      </section>

      <section className="section">
        <div className="container container-narrow">
          {!r ? (
            <NotFoundCard />
          ) : sp.done ? (
            <DoneCard />
          ) : (
            <ReservationCard r={r} sp={sp} cancel={cancel} />
          )}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function NotFoundCard() {
  return (
    <div className="bg-white border border-[var(--color-line)] rounded-sm p-6 text-center">
      <p className="text-[color:var(--color-text-light)] mb-4">
        キャンセル用 URL が無効、または既に処理されています。
      </p>
      <Link href="/" className="btn-primary">
        トップへ戻る
      </Link>
    </div>
  );
}

function DoneCard() {
  return (
    <div className="bg-white border border-[var(--color-line)] rounded-sm p-8 text-center">
      <div
        className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center text-3xl text-white"
        style={{ background: "var(--color-accent)" }}
      >
        ✓
      </div>
      <p className="font-[var(--font-jp-serif)] text-lg mb-3">
        ご予約をキャンセルしました
      </p>
      <p className="text-sm text-[color:var(--color-text-light)] mb-6">
        ご登録のメールアドレスにキャンセル確認メールをお送りしました。
        <br />
        またのご利用をお待ちしております。
      </p>
      <Link href="/" className="btn-primary">
        トップへ戻る
      </Link>
    </div>
  );
}

function ReservationCard({
  r,
  sp,
  cancel,
}: {
  r: ReservationWithRelations;
  sp: { error?: string };
  cancel: () => Promise<void>;
}) {
  const allMenus = [r.menu, ...r.extras.map((e) => e.menu)];
  const totalPrice = allMenus.reduce((s, m) => s + m.priceYen, 0);
  const totalDuration = allMenus.reduce(
    (s, m) => s + m.durationMinutes,
    0,
  );
  const isPast = r.startAt < new Date();
  const alreadyCancelled = r.status === "CANCELLED";
  const blocked = isPast || alreadyCancelled;

  return (
    <div className="bg-white border border-[var(--color-line)] rounded-sm p-6 space-y-5">
      {sp.error && (
        <p className="p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm">
          {sp.error}
        </p>
      )}

      {alreadyCancelled && (
        <p className="p-3 bg-stone-100 border border-stone-200 rounded-sm text-stone-700 text-sm">
          この予約は既にキャンセル済みです。
        </p>
      )}
      {!alreadyCancelled && isPast && (
        <p className="p-3 bg-stone-100 border border-stone-200 rounded-sm text-stone-700 text-sm">
          予約時刻を過ぎているためキャンセルできません。お電話でお問い合わせください。
        </p>
      )}

      <div>
        <h3 className="font-[var(--font-jp-serif)] font-medium mb-3">
          ご予約内容
        </h3>
        <dl className="space-y-2 text-sm">
          <Row label="お名前" value={r.customerName} />
          <Row
            label="日時"
            value={`${formatJpDateLong(r.startAt)} ${minToTimeStr(getJstHour(r.startAt) * 60 + getJstMinute(r.startAt))}〜${minToTimeStr(getJstHour(r.endAt) * 60 + getJstMinute(r.endAt))}`}
          />
          <Row label="担当" value={r.staff?.name ?? "—"} />
        </dl>
      </div>

      <div>
        <h4 className="text-xs tracking-widest text-[color:var(--color-accent)] mb-2">
          メニュー（{allMenus.length}件）
        </h4>
        <ul className="space-y-1.5 text-sm">
          {allMenus.map((m, i) => (
            <li key={i} className="flex justify-between items-baseline">
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
        <div className="border-t border-dashed border-[var(--color-line)] mt-2 pt-2 flex justify-between text-sm font-[var(--font-jp-serif)]">
          <span>合計</span>
          <span>
            ¥{totalPrice.toLocaleString()}{" "}
            <span className="text-xs text-[color:var(--color-text-light)] ml-2">
              / 約{totalDuration}分
            </span>
          </span>
        </div>
      </div>

      {!blocked && (
        <form action={cancel} className="space-y-3 pt-2">
          <p className="text-sm text-[color:var(--color-text-light)]">
            この予約をキャンセルしますか？取り消すことはできません。
          </p>
          <button
            type="submit"
            className="btn-primary btn-full"
            style={{ background: "#b91c1c", borderColor: "#b91c1c" }}
          >
            予約をキャンセルする
          </button>
        </form>
      )}

      <div className="text-center pt-2">
        <Link
          href="/"
          className="text-xs text-[color:var(--color-accent)] hover:underline"
        >
          ← トップへ戻る
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <dt className="w-20 text-[color:var(--color-text-light)] shrink-0">
        {label}
      </dt>
      <dd className="flex-1 break-all">{value}</dd>
    </div>
  );
}
