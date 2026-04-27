import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "./taki.css";

export const metadata: Metadata = {
  title: "Beauty Salon TAKI｜鹿児島県薩摩川内市の美容室・ビューティーサロンたき",
  description:
    "鹿児島県薩摩川内市西開聞町のビューティーサロンたき（Beauty Salon TAKI）。カット・カラー・パーマ・ヘナ・トリートメント・まつ毛エクステまで、髪と心にやさしい施術をお届けします。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Noto+Sans+JP:wght@300;400;500;700&family=Noto+Serif+JP:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Script src="/taki-script.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
