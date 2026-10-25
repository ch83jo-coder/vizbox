# 世界旅行 TOP10

日本・韓国・台湾・香港・タイ・ベトナム・シンガポール・フランス・イギリス・イタリア・スペイン・チェコ・アメリカ・オーストラリアの14の国・地域、26エリア・260スポットを写真から探す独立した静的サイト。国・地域 → エリア → スポットの順に辿れます。エリア別TOP10、検索、詳細ダイアログ、Google Maps、エリアフィルター付きお気に入りを提供します。保存先はブラウザーのlocalStorageです。localStorageキーは日本版のまま `japan-travel-*` を使います。

## ローカル確認

```sh
python3 -m http.server 8080 --directory travel
```

http://localhost:8080 を開きます。ビルド不要。画像と日本語フォントにはネットワーク接続が必要です。添付コラージュはローカルに保存しています。全スポットの写真はWikimedia Commonsから選定し、`assets/spots/`に保存しています。詳細画面に撮影者・ライセンス・出典を表示します。青の洞窟には所在地の真栄田岬海岸の写真を使用し、その旨を明記しています。順位は編集上のおすすめ順です。

## データ更新

`data.json` の地域とスポットを編集します。各エリアには `country`・`countryJa`・`countryKo`・`countryEn` を持たせ、国・地域ページはこの値でまとめます。写真の再取得は `python3 travel/scripts/fetch_spot_images.py` を実行します。

スポットを追加するときは `imageArticle`（英語版WikipediaのURL）と `image`（`assets/spots/<slug>.jpg`）だけを書き、`python3 travel/scripts/fetch_spot_images.py --missing` を実行すると、記事の代表写真（Commonsのjpg）を選んで保存し、撮影者・ライセンスを記録します。代表写真が地図・ロゴなど不適切な場合や見つからない場合は `imageFilePage` にCommonsのファイルページを直接指定します。営業時間・料金は未検証のため掲載していません。

## デプロイ

Vercel Root Directory = `travel`、Framework Preset = Other、Build Command = 空欄。公開操作は別途実施します。

## Claudeとの協業

`.claude/agents/japan-travel-designer.md` を使用します。Codex用の手順は `agent-extensions/claude-collaboration/SKILL.md` にあります。Claude CLIでログインした後、リポジトリのルートから次を実行できます。

```sh
claude --agent japan-travel-designer -p 'travel のUIとアクセシビリティを検討してください。ファイルは変更しないでください。'
```

## 言語

初回は韓国語（ko）を表示します。ヘッダーの韓国語・日本語ボタンで切り替え、選択を `japan-travel-language` に保存します。全スポットの名前・説明、ナビゲーション、検索、詳細、代替テキストを両言語に対応させています。検索は表示言語に関係なく韓国語と日本語を受け付け、Google Mapsには元の日本語名を渡します。

## 2カラム表示と折りたたみ端末

ビューポート幅560px以上、または画面が左右2つに分かれている端末（`horizontal-viewport-segments: 2`）では、エリアページのTOP10リストと詳細を左右に並べます。リストを押すと右側の詳細だけが切り替わります。幅が狭い場合は従来どおりダイアログで表示し、回転などで幅が変わるとその場で切り替わります。

画面分割の検出（Viewport Segments API）はChromium系（Chrome 138以降）でのみ動作し、左右の領域の幅とヒンジ位置に合わせて2カラムを配置します。iPhone DuoのSafari 27（iOS 27.1シミュレーターで確認）は既定でこのAPIに対応していないため、幅による切り替えだけが働きます。WebKitに実装はありますがフラグで無効になっています。

iPhone DuoのSafariはツールバーを画面の横に置き、ビューポートは縦向き382px・横向き594pxです。ツールバーはビューポートの外にあり内容と重なりません。横向きで `safe-area-inset-left` が84pxと報告されますが実際には重ならないため、safe-areaの余白は付けていません。

## SEO / 静的ページ

本番ドメインは https://travel.play-labo.com/ 。韓国語は `/`、日本語は `/ja/`、エリア一覧は `/regions/`、国・地域別は `/countries/<id>/`、エリア別は `/regions/<id>/`、観光地は `/spots/<slug>/` を使用します。旧ハッシュURLは新しいURLへ移動します。

データ・ページ雛形を編集した後は `python3 travel/scripts/build_seo.py` を実行し、生成されたHTMLとsitemap.xmlを一緒にコミットしてください。雛形は `scripts/page-template.html` です。ビルドなしでも全ページの見出し・本文・リンク・JSON-LDをHTTP応答に含めます。言語はURLで決まり、切り替えボタンは同じページの別言語URLへ移動します。

各ページにcanonical・hreflang・OGP・Twitter Cardを設定。お気に入りはnoindexです。robots.txtからsitemap.xmlを案内します。公開後、Google Search Consoleでドメイン所有権を確認し `https://travel.play-labo.com/sitemap.xml` を送信してください。検索結果への掲載時期は検索エンジンによって決まります。

### 旧ドメインからの移行

旧ドメイン https://japantravel.play-labo.com/ はURLパスが同じなので、Vercelの Settings → Domains で `travel.play-labo.com` を追加した後、`japantravel.play-labo.com` を「Redirect to travel.play-labo.com（308）」に変更します。新ドメインを接続する前にこのビルドを公開すると、canonicalがまだ存在しないドメインを指すため、ドメイン接続を先に済ませてください。Search Consoleでは新ドメインのプロパティを確認した後、旧プロパティで「アドレス変更」を実行します。Naverサーチアドバイザーにも新ドメインを登録します。

各エリアに10件の編集おすすめを掲載します。広島には宮島・尾道・大久野島など県内の周辺旅行先を含め、福岡は福岡市のスポットを中心に紹介します。地域数・スポット数はデータから自動計算します。

地域候補・説明の確認先：[札幌観光](https://www.sapporo.travel/)、[横浜観光](https://www.yokohamajapan.com/)、[名古屋観光](https://www.nagoya-info.jp/)、[広島観光](https://dive-hiroshima.com/)、[福岡市観光](https://www.gofukuoka.jp/)。各写真の出典は data.json に記録しています。

## OG画像

共有画像は `assets/og/japan-travel-ko.jpg` と `japan-travel-ja.jpg`（1200×630）です。`scripts/og-card.html` がデザイン元で、エッフェル塔・浅草寺・シドニー・オペラハウスの掲載写真を使用します。各写真の撮影者・ライセンスは `data.json` の該当スポットを参照してください。全ページに言語別のOG画像・Twitter Cardを設定しています。
