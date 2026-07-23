import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import "./taki.css";

const SITE_URL = "https://www.takibs.com";
const SITE_NAME = "Beauty Salon TAKI";
const DESCRIPTION =
  "鹿児島県薩摩川内市西開聞町の美容室「ビューティーサロンたき (Beauty Salon TAKI)」。カット・カラー・パーマ・ヘナ・トリートメント・ヘッドスパ・まつ毛エクステまで、髪と心にやさしい施術をお届けします。24時間オンライン予約OK。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}｜鹿児島県薩摩川内市の美容室・ビューティーサロンたき`,
    template: `%s｜${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "美容室",
    "ヘアサロン",
    "薩摩川内市",
    "鹿児島",
    "西開聞町",
    "ビューティーサロンたき",
    "Beauty Salon TAKI",
    "カット",
    "カラー",
    "パーマ",
    "ヘナ",
    "白髪染め",
    "ヘッドスパ",
    "まつ毛エクステ",
    "まつ毛パーマ",
    "予約",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    telephone: true,
    address: true,
    email: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME}｜鹿児島県薩摩川内市の美容室`,
    description: DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 480,
        height: 480,
        alt: `${SITE_NAME} ロゴ`,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME}｜鹿児島県薩摩川内市の美容室`,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#8a7860",
};

// LocalBusiness 構造化データ (Google のリッチリザルト対応)
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "HairSalon",
  "@id": `${SITE_URL}/#hairsalon`,
  name: SITE_NAME,
  alternateName: "ビューティーサロンたき",
  description: DESCRIPTION,
  url: SITE_URL,
  telephone: "+81-996-22-4342",
  image: `${SITE_URL}/og-image.png`,
  logo: `${SITE_URL}/icon.png`,
  priceRange: "¥1,600 - ¥15,000",
  address: {
    "@type": "PostalAddress",
    streetAddress: "西開聞町1-11",
    addressLocality: "薩摩川内市",
    addressRegion: "鹿児島県",
    postalCode: "895-0055",
    addressCountry: "JP",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 31.8153,
    longitude: 130.2988,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Sunday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      opens: "09:30",
      closes: "19:00",
    },
  ],
  sameAs: [
    "https://www.instagram.com/beautysalontaki/",
    "https://www.facebook.com/taki.bs1",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "サロンメニュー",
    itemListElement: [
      {
        "@type": "OfferCatalog",
        name: "カット",
        itemListElement: [
          { "@type": "Offer", name: "カット", price: "3600", priceCurrency: "JPY" },
        ],
      },
      {
        "@type": "OfferCatalog",
        name: "カラー",
        itemListElement: [
          { "@type": "Offer", name: "カラー", price: "6600", priceCurrency: "JPY" },
          { "@type": "Offer", name: "ヘナ100%カラー", price: "9600", priceCurrency: "JPY" },
        ],
      },
      {
        "@type": "OfferCatalog",
        name: "パーマ",
        itemListElement: [
          { "@type": "Offer", name: "パーマ", price: "7200", priceCurrency: "JPY" },
        ],
      },
      {
        "@type": "OfferCatalog",
        name: "アイラッシュ",
        itemListElement: [
          { "@type": "Offer", name: "まつ毛パーマ", price: "3600", priceCurrency: "JPY" },
        ],
      },
    ],
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body>
        {children}
        <Script src="/taki-script.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
