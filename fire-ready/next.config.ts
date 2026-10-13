import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // true だと未生成の /guides/[slug] がストリーミングで始まり、notFound() が 200 + noindex になる。
  // 全ページ静的なので従来のプリフェッチで十分。未作成のガイドは 404 を返す
  partialPrefetching: false,
};

export default nextConfig;
