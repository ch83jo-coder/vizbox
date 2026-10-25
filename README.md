# vizbox

小さな可視化プロジェクト集。各フォルダは完全に独立していて、それぞれ単体で Vercel にデプロイできます。

| プロジェクト | 内容 |
| --- | --- |
| [japan-density](./japan-density) | 日本の人口密度 3D マップ |
| [japan-travel](./japan-travel) | 写真で探す世界旅行 TOP10・14の国・地域260スポット |
| [fire-ready](./fire-ready) | FIRE 資産シミュレーター（Next.js） |
| [php-security](./php-security) | PHP セキュリティ対応・50サービス一覧（韓・日・英、外部リンクなし） |

## 構成ルール

- 1プロジェクト = 1フォルダ。フォルダ間で共有コードを持たない
- 各フォルダに `index.html`(またはフレームワーク一式)と `README.md` を置く
- データ生成スクリプトはそのフォルダの `scripts/` に置く

## Vercel へのデプロイ

1. Vercel で New Project から このリポジトリを選択
2. Root Directory にプロジェクトのフォルダ(例: `japan-density`)を指定
3. 静的サイトなら Framework Preset は Other、Build Command は空欄
4. Next.js のプロジェクト(`fire-ready`)は Framework Preset を Next.js にし、Build Command は既定のまま

プロジェクトごとに Vercel プロジェクトを1つ作る形になります。関係ないフォルダの変更で再デプロイされないよう、各プロジェクトの Settings → Git で "Ignored Build Step" に次を設定しておくと便利です。

```
git diff HEAD^ HEAD --quiet -- .
```
