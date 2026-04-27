import Link from "next/link";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";

export const metadata = { title: "予約完了｜Beauty Salon TAKI" };

export default function CompletePage() {
  return (
    <>
      <SiteHeader active="reservation" />

      <section className="page-head">
        <div className="page-head-inner">
          <p className="section-en">Thank You</p>
          <h1 className="page-title">ご予約ありがとうございます</h1>
        </div>
      </section>

      <section className="section">
        <div className="container container-narrow text-center">
          <div className="bg-white border border-[var(--color-line)] rounded-sm p-10">
            <div
              className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center text-3xl text-white"
              style={{ background: "var(--color-accent)" }}
            >
              ✓
            </div>
            <p className="font-[var(--font-jp-serif)] text-lg mb-3">
              ご予約を承りました
            </p>
            <p className="text-sm text-[color:var(--color-text-light)] mb-2">
              ご登録いただいたメールアドレス宛に、予約確認メールをお送りしました。
            </p>
            <p className="text-sm text-[color:var(--color-text-light)] mb-8">
              当日のご来店をお待ちしております。
            </p>
            <Link href="/" className="btn-primary">
              トップへ戻る
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
