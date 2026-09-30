# japan-density

日本の人口密度を3Dの棒グラフで表現したマップ。

- 2015年国勢調査の市区町村人口を約5kmメッシュに配分した推計値
- three.js r128(CDN)を使用、ビルド不要の静的サイト
- 沖縄は右下の点線枠にインセット表示

## ローカル確認

```bash
npx serve .
```

`data.json` を fetch するため、`index.html` を直接開くのではなくサーバー経由で確認してください。

## データ再生成

```bash
pip install shapely numpy
python scripts/build_data.py
```

## デプロイ

Vercel で Root Directory を `japan-density` に設定。Framework Preset は Other、Build Command は空欄。
