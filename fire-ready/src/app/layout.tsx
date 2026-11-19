import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import AppTheme from "@/components/AppTheme";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { FIRE_ASSETS } from "@/lib/assets";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { tokens } from "@/lib/tokens";
import "./globals.css";

// 日本語フォントは文字数が多いため preload せず、読み込み失敗時はシステムフォントで表示する
const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
  // next/font は引数にリテラルしか受け付けない（lib/tokens の FONT_FALLBACK と同じ内容）
  fallback: [
    "Hiragino Sans",
    "Hiragino Kaku Gothic ProN",
    "Yu Gothic",
    "Meiryo",
    "sans-serif",
  ],
});

// openGraph・twitter の title/description は各ページの title/description から自動で補完される
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `FIREシミュレーター｜必要資産と資産の推移を試算｜${SITE_NAME}`,
    template: `%s｜${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ja_JP",
    images: [
      {
        url: FIRE_ASSETS.hero.src,
        width: FIRE_ASSETS.hero.width,
        height: FIRE_ASSETS.hero.height,
        alt: "海と山を望む円い窓の前に、大理石の段とガラス玉、松の木が並ぶイラスト",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  robots: { "max-image-preview": "large" },
  verification: {
    google: "f21cCBWKUbZL0yZpFqgmCy_KPK-CHbFkM1C6ExOUjH8",
  },
};

export const viewport: Viewport = {
  themeColor: tokens.background,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={notoSansJp.variable}>
      <body>
        <AppRouterCacheProvider>
          <AppTheme>
            <a href="#main" className="skip-link">
              本文へスキップ
            </a>
            <SiteHeader />
            <main id="main" tabIndex={-1}>
              {children}
            </main>
            <SiteFooter />
          </AppTheme>
        </AppRouterCacheProvider>
        <Analytics />
      </body>
    </html>
  );
}
