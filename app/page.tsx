import Link from "next/link";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { SiteHeader } from "./_components/SiteHeader";
import { SiteFooter } from "./_components/SiteFooter";

// LINE 公式アカウント連携 URL
// - LINE_BUTTON_URL: PC/スマホからクリックする用 (LIFF 経由で追加フロー起動)
// - LINE_QR_URL: QR コードにエンコードする URL (スマホカメラで読取り→LINEアプリ起動)
const LINE_BUTTON_URL =
  "https://taki-line-harness.bstaki.workers.dev/auth/line?ref=setup";
const LINE_QR_URL =
  "https://liff.line.me/2010751138-wW8tMGtM?liffId=2010751138-wW8tMGtM&ref=setup";

export const metadata = {
  title: "Beauty Salon TAKI｜鹿児島県薩摩川内市の美容室・ビューティーサロンたき",
};

export default function Home() {
  return (
    <>
      <SiteHeader active="home" />

      <section className="hero">
        <div className="hero-img"></div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <p className="hero-sub">— Beauty Salon TAKI / Satsumasendai —</p>
          <h1 className="hero-title">
            <span>髪と心に、</span>
            <span>やさしい時間を。</span>
          </h1>
          <p className="hero-desc">
            鹿児島県薩摩川内市の小さなまちの美容室。<br />
            ヘナや天然由来の薬剤で、あなただけの心地よい時間を。
          </p>
          <Link href="/menus" className="btn-primary">ご予約はこちら</Link>
        </div>
        <div className="scroll-down"><span>SCROLL</span></div>
      </section>

      <section className="section" id="concept">
        <div className="container">
          <div className="section-head">
            <p className="section-en">Concept</p>
            <h2 className="section-title">わたしたちの想い</h2>
          </div>
          <div className="concept-grid">
            <div className="concept-img">
              <Image
                src="/concept.png"
                alt="Beauty Salon TAKI 店内 - 施術の様子"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 500px"
                className="concept-photo"
              />
            </div>
            <div className="concept-text">
              <h3>しっかりとした技術に裏打ちされた、信頼のサロン。</h3>
              <p>
                長年積み重ねてきた確かな技術と知識で、<br />
                お一人おひとりの髪質・骨格・なりたいイメージに、丁寧にお応えします。
              </p>
              <p>
                流行を取り入れながらも、似合うこと・続けやすいことを大切に。<br />
                落ち着いた空間で、安心してお任せいただけるサロンを目指しています。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-bg">
        <div className="container">
          <div className="section-head">
            <p className="section-en">Features</p>
            <h2 className="section-title">サロンの特徴</h2>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-num">01</div>
              <h3>確かな技術力</h3>
              <p>長年培った技術で、カット・カラー・パーマ・ヘナまで幅広いメニューを高い品質でご提供します。</p>
            </div>
            <div className="feature-card">
              <div className="feature-num">02</div>
              <h3>髪にやさしい施術</h3>
              <p>ヘナや天然由来のメニューもご用意。髪と頭皮への負担を抑えた施術を心がけています。</p>
            </div>
            <div className="feature-card">
              <div className="feature-num">03</div>
              <h3>丁寧なカウンセリング</h3>
              <p>髪質・骨格・ライフスタイルに合わせたご提案で、お一人おひとりにぴったりの仕上がりへ。</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <p className="section-en">Menu</p>
            <h2 className="section-title">メニュー</h2>
          </div>
          <div className="menu-preview">
            <div className="menu-preview-item">
              <h3>Cut</h3>
              <p className="menu-price">¥3,600〜</p>
              <p>骨格と髪質に合わせた似合わせカット</p>
            </div>
            <div className="menu-preview-item">
              <h3>Color</h3>
              <p className="menu-price">¥6,600〜</p>
              <p>髪にやさしい多彩なカラーメニュー</p>
            </div>
            <div className="menu-preview-item">
              <h3>Henna</h3>
              <p className="menu-price">¥9,600〜</p>
              <p>髪と頭皮をいたわるヘナ100%カラー</p>
            </div>
            <div className="menu-preview-item">
              <h3>Eyelash</h3>
              <p className="menu-price">¥3,600〜</p>
              <p>まつ毛パーマ・エクステンション</p>
            </div>
          </div>
          <div className="text-center">
            <Link href="/menus" className="btn-secondary">メニュー一覧を見る</Link>
          </div>
        </div>
      </section>

      <section className="section section-bg" id="access">
        <div className="container">
          <div className="section-head">
            <p className="section-en">Access</p>
            <h2 className="section-title">店舗情報・アクセス</h2>
          </div>
          <div className="access-grid">
            <div className="access-info">
              <dl className="info-list">
                <div><dt>店舗名</dt><dd>Beauty Salon TAKI<br />（ビューティーサロンたき）</dd></div>
                <div><dt>住所</dt><dd>〒895-0055<br />鹿児島県薩摩川内市西開聞町1-11</dd></div>
                <div><dt>電話番号</dt><dd><a href="tel:0996-22-4342">0996-22-4342</a></dd></div>
                <div><dt>営業時間</dt><dd>9:30 – 19:00<br />（最終受付：カット18:00／カラー・パーマ17:00）</dd></div>
                <div><dt>定休日</dt><dd>毎週月曜日／第3日曜日</dd></div>
                <div><dt>駐車場</dt><dd>あり</dd></div>
              </dl>
            </div>
            <div className="access-map">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3390.3552049404275!2d130.29878907610737!3d31.815318532509803!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x353e387176816fad%3A0x5fe529a8a4054a52!2z44Gf44GN576O5a655a6k!5e0!3m2!1sja!2sjp!4v1777105776095!5m2!1sja!2sjp"
                width="100%"
                height="450"
                style={{ border: 0, display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Beauty Salon TAKI 地図"
              />
            </div>
          </div>
        </div>
      </section>

      {/* LINE でお問い合わせ */}
      <section className="section" id="line">
        <div className="container container-narrow">
          <div className="section-head">
            <p className="section-en">LINE</p>
            <h2 className="section-title">LINEでお問い合わせ</h2>
            <p className="section-desc">
              ご予約のご相談・お問い合わせは LINE 公式アカウントが便利です。
              <br className="hidden md:inline" />
              メニューや空き状況について、お気軽にメッセージください。
            </p>
          </div>

          <div className="line-grid">
            {/* 左: 追加ボタン */}
            <div className="line-block">
              <p className="line-block-label">スマホの方はこちら</p>
              <a
                href={LINE_BUTTON_URL}
                className="line-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  className="line-icon"
                  viewBox="0 0 320 320"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M160 32C87 32 27 79 27 137c0 52 47 96 111 105 4 1 10 3 11 6 1 3 1 8 0 11l-2 11c-1 3-3 13 11 7 14-6 76-45 104-77 20-22 33-45 33-63C295 79 235 32 160 32z"
                  />
                  <path
                    fill="#06C755"
                    d="M259 122h-19c-1 0-1 0-1-1v-29c0-1 0-2 1-2h19c1 0 2 1 2 2v29c0 1-1 1-2 1zM152 122h-19c-1 0-1 0-1-1v-29c0-1 0-2 1-2h19c1 0 2 1 2 2v29c0 1-1 1-2 1zM194 122h-19c-1 0-1 0-1-1v-15l-13 15c0 1-1 1-1 1h-19c-1 0-2-1-2-2V91c0-1 1-2 2-2h19c1 0 1 0 1 1v15l13-15h20c1 0 2 1 2 2v29c0 1-1 1-2 1zM240 122h-31c-1 0-2-1-2-2V91c0-1 1-2 2-2h31c1 0 2 1 2 2v6c0 1-1 2-2 2h-22v5h22c1 0 2 1 2 2v6c0 1-1 2-2 2h-22v5h22c1 0 2 1 2 2v6c0 1-1 1-2 1z"
                  />
                </svg>
                <span>LINEで友だち追加</span>
              </a>
              <p className="line-hint">
                タップで LINE アプリが開きます
              </p>
            </div>

            {/* 右: QR コード */}
            <div className="line-block">
              <p className="line-block-label">PC の方は QR で読み取り</p>
              <div className="line-qr-frame">
                <QRCodeSVG
                  value={LINE_QR_URL}
                  size={180}
                  level="M"
                  marginSize={0}
                  fgColor="#2d2620"
                />
              </div>
              <p className="line-hint">
                スマホのカメラで読み取ってください
              </p>
            </div>
          </div>

          <p className="line-note-under">
            ※ お急ぎの場合はお電話でも承っています：
            <a
              href="tel:0996-22-4342"
              className="text-[color:var(--color-accent)] underline"
            >
              0996-22-4342
            </a>
          </p>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>ご予約・お問い合わせ</h2>
          <p>オンライン予約は24時間受付中。ご相談は LINE から。</p>
          <div className="cta-buttons">
            <Link href="/menus" className="btn-primary">オンライン予約</Link>
            <a
              href={LINE_BUTTON_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-line-cta"
            >
              LINEで問い合わせ
            </a>
            <a href="tel:0996-22-4342" className="btn-secondary">電話で予約</a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
