import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import AppTheme from "@/components/AppTheme";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
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

export const metadata: Metadata = {
  title: {
    default: "FIRE READY｜資産だけでなく、自由に生きる準備を。",
    template: "%s｜FIRE READY",
  },
  description:
    "いくら必要か、いつ目指せるか。あなたの条件でFIREをシミュレーション。会員登録なしで、必要資産の目安と資産の推移を試算できます。",
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
