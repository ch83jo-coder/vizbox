/** asset-manifest.json の実寸。src は public を除いた配信 URL */
export const FIRE_ASSETS = {
  hero: { src: "/images/fire-ready/hero.png", width: 1536, height: 1024 },
  "icon-assets": {
    src: "/images/fire-ready/icon-assets.png",
    width: 1254,
    height: 1254,
  },
  "icon-timeline": {
    src: "/images/fire-ready/icon-timeline.png",
    width: 1254,
    height: 1254,
  },
  "icon-readiness": {
    src: "/images/fire-ready/icon-readiness.png",
    width: 1254,
    height: 1254,
  },
  "thumbnail-rental": {
    src: "/images/fire-ready/thumbnail-rental.png",
    width: 1536,
    height: 1024,
  },
  "thumbnail-credit": {
    src: "/images/fire-ready/thumbnail-credit.png",
    width: 1536,
    height: 1024,
  },
} as const;

export type FireAssetId = keyof typeof FIRE_ASSETS;

export function isFireAssetId(id: string): id is FireAssetId {
  return id in FIRE_ASSETS;
}
