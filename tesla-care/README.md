# モデル3 セルフ整備（Model 3 DIY Care）

テスラ初心者向けの整備ガイドと用品紹介サイト。モデル3（旧型2017〜2023年・新型ハイランド2024年〜）を対象に、ウォッシャー液の補充・ワイパー交換・タイヤ空気圧の調整を手順と注意点つきで案内し、Amazonの検索結果へのリンクで用品を紹介します。韓国語は `/`、日本語は `/ja/`、英語は `/en/`。

## ローカル確認

```sh
python3 -m http.server 8080 --directory tesla-care
```

## 更新

ガイドと用品は `data.json` を編集し、`python3 tesla-care/scripts/build.py` で全ページ・sitemap.xml・robots.txtを生成します。生成したHTMLも一緒にコミットしてください。

- **Amazonリンク**: 日本語は amazon.co.jp、韓国語・英語は amazon.com の検索結果へリンクします（`STORE`）。商品ページ（ASIN）ではなく検索リンクにしているのは、リンク切れや在庫切れを避けるためです。各用品の `query` が検索語です。
- **アソシエイトタグ**: `scripts/build.py` の `TAGS`（`jp`・`us`）に入れて再生成すると全リンクに付きます。フッターにアフィリエイトの表記があります。
- **液体の用品**（`"liquid": true`）は、韓国語ページで海外配送の制限についての注意を表示します。
- **ドメイン**: 本番は https://tesla-care.play-labo.com 。`ORIGIN`（canonical・hreflang・sitemap用）に設定しています。

## 内容の根拠

手順・数値はテスラのモデル3オーナーズマニュアル（ウォッシャー液3.2L、4℃未満は凍結防止液、撥水・虫取り成分入りは不可、ワイパーサービスモード、年1回以上の交換、ドア柱ラベルの冷間空気圧、25km/h以上の走行でTPMS更新など）に基づきます。ワイパー寸法（26/19インチ、プッシュボタン式）はテスラが公開していないため部品販売店の適合情報によるもので、ページでも購入前に実物を測るよう案内しています。出典は `data.json` の `sources` に記載し、各ガイドに表示します。

## デプロイ

Vercel Root Directory = `tesla-care`、Framework Preset = Other、Build Command = 空欄。
