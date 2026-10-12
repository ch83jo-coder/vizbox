# 日本旅行 TOP10

東京・大阪・京都・九州・沖縄の50スポットを写真から探す独立した静的サイト。地域別TOP10、検索、詳細ダイアログ、Google Maps、地域フィルター付きお気に入りを提供します。保存先はブラウザーのlocalStorageです。

## ローカル確認

```sh
python3 -m http.server 8080 --directory japan-travel
```

http://localhost:8080 を開きます。ビルド不要。画像と日本語フォントにはネットワーク接続が必要です。添付コラージュはローカルに保存しています。50スポットの写真はWikimedia Commonsから選定し、`assets/spots/`に保存しています。詳細画面に撮影者・ライセンス・出典を表示します。青の洞窟には所在地の真栄田岬海岸の写真を使用し、その旨を明記しています。順位は編集上のおすすめ順です。

## データ更新

`data.json` の地域とスポットを編集します。写真の再取得は `python3 japan-travel/scripts/fetch_spot_images.py` を実行します。営業時間・料金は未検証のため掲載していません。

## デプロイ

Vercel Root Directory = `japan-travel`、Framework Preset = Other、Build Command = 空欄。公開操作は別途実施します。

## Claudeとの協業

`.claude/agents/japan-travel-designer.md` を使用します。Codex用の手順は `agent-extensions/claude-collaboration/SKILL.md` にあります。Claude CLIでログインした後、リポジトリのルートから次を実行できます。

```sh
claude --agent japan-travel-designer -p 'japan-travel のUIとアクセシビリティを検討してください。ファイルは変更しないでください。'
```

## 言語

初回は韓国語（ko）を表示します。ヘッダーの韓国語・日本語ボタンで切り替え、選択を `japan-travel-language` に保存します。50スポットの名前・説明、ナビゲーション、検索、詳細、代替テキストを両言語に対応させています。検索は表示言語に関係なく韓国語と日本語を受け付け、Google Mapsには元の日本語名を渡します。

## SEO / 静的ページ

本番ドメインは https://japantravel.play-labo.com/ 。韓国語は `/`、日本語は `/ja/`、地域一覧は `/regions/`、地域別は `/regions/<id>/`、観光地は `/spots/<slug>/` を使用します。旧ハッシュURLは新しいURLへ移動します。

データ・ページ雛形を編集した後は `python3 japan-travel/scripts/build_seo.py` を実行し、生成されたHTMLとsitemap.xmlを一緒にコミットしてください。雛形は `scripts/page-template.html` です。ビルドなしでも全ページの見出し・本文・リンク・JSON-LDをHTTP応答に含めます。言語はURLで決まり、切り替えボタンは同じページの別言語URLへ移動します。

各ページにcanonical・hreflang・OGP・Twitter Cardを設定。お気に入りはnoindexです。robots.txtからsitemap.xmlを案内します。公開後、Google Search Consoleでドメイン所有権を確認し `https://japantravel.play-labo.com/sitemap.xml` を送信してください。検索結果への掲載時期は検索エンジンによって決まります。
