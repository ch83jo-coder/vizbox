# テスラ セルフ整備（Tesla DIY Care）

テスラ初心者向けの整備ガイドと用品紹介サイト。モデル3（旧型2017〜2023年・ハイランド2024年〜）とモデルY（旧型2020〜2024年・ジュニパー2025年〜）を対象に、ウォッシャー液の補充・ワイパー交換・タイヤ空気圧の調整を写真・図解・手順・注意点つきで案内し、車に合う用品をAmazonへのリンクで紹介します。韓国語は `/`、日本語は `/ja/`、英語は `/en/`。

## ページ構成

- `/` 車の選択（モデル3・モデルYごとに写真で年式を選ぶ。選んだ車はlocalStorage `tc-model` に保存し、次回トップに表示）
- `/<model>/` その車用の「これだけ買えばOK」リスト（各ガイドの `role: main` の用品）と、あると便利なもの（`extra`）、ガイド一覧
- `/<model>/<guide>/` 写真、図解、手順、その車での注意（`modelNotes`）、おすすめ1点（`main`）とほかの選択肢

旧URL `/guides/<slug>/` はトップへ308でリダイレクトします（`vercel.json`）。

## 画像

- **写真**: `data.json` の `photos` にCommonsのファイル名を書き、`python3 tesla-care/scripts/fetch_images.py` で `assets/photos/` に保存、撮影者・ライセンスを記録します。各ページのフッターにクレジットを表示します。
- **図解**: 手順の図は `scripts/build.py` の `diagram()` がページの言語のラベルでインラインSVGとして描きます。
- **用品のイラスト**: `assets/illustrations/*.svg`。Amazonの商品画像は、Product Advertising API（アソシエイト承認後）経由でないと掲載できないため使っていません。

## ローカル確認

```sh
python3 -m http.server 8080 --directory tesla-care
```

## 更新

ガイドと用品は `data.json` を編集し、`python3 tesla-care/scripts/build.py` で全ページ・sitemap.xml・robots.txtを生成します。生成したHTMLも一緒にコミットしてください。

- **Amazonリンク**: すべての言語で amazon.co.jp にリンクします（`STORE`）。韓国語・英語ページには、Amazon.co.jpへのリンクであることと海外配送は商品ごとに異なる旨を表示します。用品に `asin`（`{"<model>": {"jp": "...", "us": "..."}}`）があればその商品ページへ、なければ検索結果へリンクします。検索語は `query`、車ごとに変える場合は `queryByModel`。ASINは適合を確認できたものだけ入れてください。SiteStripeで作った短縮リンク（`https://amzn.to/...`）は `link` に書くと、全車種・全言語でそのまま使います（タグ込みなので `TAGS` は付けません）。車ごとに別々に買う商品（ハイランドの運転席・助手席ワイパーなど）は `linksByModel` にリンクとボタン名を並べ、名前・説明を変える場合は `nameByModel`・`whyByModel` を使います。フッターにはアソシエイト規約の表示文（「Amazonのアソシエイトとして…」）を全言語で表示します。
- **アソシエイトタグ**: `scripts/build.py` の `TAGS`（`jp`・`us`）に入れて再生成すると全リンクに付きます。フッターにアフィリエイトの表記があります。
- **液体の用品**（`"liquid": true`）は、韓国語・英語ページで海外配送の制限についての注意を表示します。
- **ドメイン**: 本番は https://tesla-care.play-labo.com 。`ORIGIN`（canonical・hreflang・sitemap用）に設定しています。

## 車種の追加

`data.json` の `models` に `id`・`family`（`families` のキー）・`photo`・名前・年式・見分け方を追加し、各ガイドの `modelNotes`、車種で値が違う項目の `valueByModel`（`facts` 内）、用品の `queryByModel` などを足します。`sources` は `family` ごとに表示されます。

## 内容の根拠

手順・数値はテスラのモデル3・モデルYのオーナーズマニュアル（ウォッシャー液はモデル3が3.2L・モデルYが4.5L、4℃未満は凍結防止液、撥水・虫取り成分入りは不可、ワイパーサービスモード、年1回以上の交換、ドア柱ラベルの冷間空気圧、25km/h以上の走行でTPMS更新など）に基づきます。ワイパー寸法（26/19インチ、プッシュボタン式。旧型モデルYの助手席は20インチ表記の店もあり）はテスラが公開していないため部品販売店の適合情報によるもので、ページでも購入前に実物を測るよう案内しています。出典は `data.json` の `sources` に記載し、各ガイドに表示します。

## デプロイ

Vercel Root Directory = `tesla-care`、Framework Preset = Other、Build Command = 空欄。
