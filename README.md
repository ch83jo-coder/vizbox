# vizbox

小さな可視化プロジェクト集。各フォルダは完全に独立していて、それぞれ単体で Vercel にデプロイできます。

| プロジェクト | 内容 |
| --- | --- |
| [japan-density](./japan-density) | 日本の人口密度 3D マップ |

## 構成ルール

- 1プロジェクト = 1フォルダ。フォルダ間で共有コードを持たない
- 各フォルダに `index.html`(またはフレームワーク一式)と `README.md` を置く
- データ生成スクリプトはそのフォルダの `scripts/` に置く

## Vercel へのデプロイ

1. Vercel で New Project から このリポジトリを選択
2. Root Directory にプロジェクトのフォルダ(例: `japan-density`)を指定
3. 静的サイトなら Framework Preset は Other、Build Command は空欄

プロジェクトごとに Vercel プロジェクトを1つ作る形になります。関係ないフォルダの変更で再デプロイされないよう、各プロジェクトの Settings → Git で "Ignored Build Step" に次を設定しておくと便利です。

```
git diff HEAD^ HEAD --quiet -- .
```
