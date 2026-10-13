# FIRE READY

日本在住のFIRE・サイドFIRE準備者向けの資産シミュレーター。「資産だけでなく、自由に生きる準備を。」

- 会員登録なしで、必要資産の目安・目標時点の予想資産と不足額・単純基準を満たす時期・資産がゼロになる時期を即時に試算
- 月単位の決定論的な名目円モデル。現在の購買力／名目の表示切り替え、利回り±2%ptの比較、グラフと表
- 端末への保存は利用者が選んだときだけ。共有リンクは同意後にURLフラグメント（`#share=v1.…`）へ格納し、クエリ文字列は使わない
- 試算サマリーのPNG保存（金額は既定で含めない）
- Phase 2「FIRE後の生活準備ガイド」は、コンテンツスキーマ・ルート・noindexプレビュー・ローカルチェックリストまで準備済み。公開記事はまだない

計算式と前提は `/methodology`、保存と共有の扱いは `/privacy` に記載しています。

## 構成

- Next.js 16.4（App Router・Cache Components）+ TypeScript strict、MUI 9 + Emotion、React Hook Form + Zod 4、Recharts 3
- 金融エンジンは `src/lib/fire/` の純粋なTypeScript（`engine.ts` 計算、`schema.ts` 入力検証と単位変換、`scenarios.ts` 比較、`display.ts` 実質／名目の換算）。UIからは独立
- ランディング・ガイドは Server Component、フォーム・グラフ・保存・共有だけ Client Component
- ガイドのデータは `src/content/guides/`。`status: "published"` には確認日・確認者・確認日付きの出典が必須で、ビルド時にスキーマ検証する
- 画像は `public/images/fire-ready/`（FIRE READY 開発パッケージ付属の文字なし生成画像6点）。実寸は `src/lib/assets.ts`
- 依存関係のバージョンは `package.json` で固定。Node 22

## ローカル確認

```sh
cd fire-ready
yarn install
yarn dev
```

http://localhost:3000 を開きます。フォントは Google Fonts（Noto Sans JP）を next/font で自己ホストし、読み込めない場合は日本語システムフォントで表示します。

## 検証

```sh
yarn typecheck   # next typegen + tsc
yarn lint        # Biome
yarn test        # Vitest：計算エンジン・単位変換・共有リンク・保存データ
yarn build
yarn test:e2e    # Playwright：360/390/768/1280/1440 の画面と主要フロー（ビルドして 3200 番で起動）
```

E2E のフルページ画面は `test-results/screens/` に保存されます（gitignore 対象）。

## ガイドの公開

`src/content/guides/index.ts` の該当エントリーに本文（`body`）・出典（`checked_at` 付き）・`reviewed_at`・`reviewer` を入れて `status: "published"` にします。制度・審査条件・料率は信用情報機関・金融機関・保証会社・日本年金機構・自治体・国税庁などの一次情報を確認してから公開してください。未確認の内容は `draft` のままにします。未作成のテーマ（`/guides/housing-loan` など）は 404 を返します。

## デプロイ

Vercel で Root Directory を `fire-ready` に設定。Framework Preset は Next.js（自動検出）、Build Command・Output は既定のまま。Node.js は 22.x。

他フォルダの変更で再デプロイされないよう、Settings → Git の Ignored Build Step に `git diff HEAD^ HEAD --quiet -- .` を設定してください。
