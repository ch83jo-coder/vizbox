import { type Guide, guideSchema } from "./schema";

const PREVIEW_LIMITATIONS = [
  "このチェックリストは、審査の結果を予測・保証するものではありません。",
  "審査の基準や必要な書類は、事業者・物件・商品ごとに異なります。制度や条件の詳細は、公開前に公式情報を確認して掲載します。",
];

const draft: Pick<
  Guide,
  | "country"
  | "region"
  | "status"
  | "reviewed_at"
  | "review_due_at"
  | "reviewer"
  | "body"
> = {
  country: "JP",
  region: null,
  status: "draft",
  reviewed_at: null,
  review_due_at: null,
  reviewer: null,
  body: [],
};

/** 制度・審査条件の記述は公式情報の確認後に公開する。未確認の内容は draft のまま非公開 */
const GUIDE_ENTRIES: Guide[] = [
  {
    ...draft,
    slug: "rental-preparation",
    title_ja: "FIRE後の賃貸契約に向けた準備",
    summary_ja:
      "FIRE後に賃貸住宅を借りるときに、前もって確認・準備しておきたいことを整理します。",
    category: "rental",
    sources: [],
    limitations: PREVIEW_LIMITATIONS,
    thumbnail_asset_id: "thumbnail-rental",
    outline_ja: [
      "審査で確認される資料を、管理会社・保証会社ごとに確認する",
      "残高証明・取引明細など、求められる可能性がある資料",
      "保証会社・貸主の条件の確認",
      "連絡先・費用・チェックリスト",
    ],
    checklist: [
      {
        id: "ask-documents",
        label:
          "希望する物件の管理会社・保証会社に、審査で確認する書類を問い合わせる",
        optional: false,
        official_link: null,
      },
      {
        id: "prepare-statements",
        label:
          "残高証明や取引明細を求められた場合の取得方法を、利用中の金融機関で確認する",
        optional: false,
        official_link: null,
      },
      {
        id: "guarantor-terms",
        label: "保証会社の利用条件と費用を、契約前に書面で確認する",
        optional: false,
        official_link: null,
      },
      {
        id: "contacts",
        label: "本人と緊急連絡先の電話番号・メールアドレスを最新にしておく",
        optional: false,
        official_link: null,
      },
      {
        id: "budget",
        label: "初期費用と毎月の家賃が、生活費の予算に収まるか確認する",
        optional: true,
        official_link: null,
      },
    ],
  },
  {
    ...draft,
    slug: "credit-history",
    title_ja: "退職後のクレジットカードと信用情報",
    summary_ja:
      "退職後のクレジットカードの利用・申込みと信用情報について、確認しておきたいことを整理します。",
    category: "credit",
    sources: [
      {
        title: "クレジット・ガイダンスの見方",
        url: "https://www.cic.co.jp/mydata/report/documents/cgmikata.pdf",
        publisher: "株式会社シー・アイ・シー（CIC）",
        checked_at: null,
        claim:
          "クレジット・ガイダンスの指標の算出に使う情報の範囲（公開前に確認）",
      },
    ],
    limitations: PREVIEW_LIMITATIONS,
    thumbnail_asset_id: "thumbnail-credit",
    outline_ja: [
      "CICのクレジット・ガイダンスと、各社の審査の違い",
      "返済・口座振替・連絡先の管理",
      "新規発行や条件変更は、各社の公式情報で確認",
      "職業欄は実際の状況をそのまま伝える",
    ],
    checklist: [
      {
        id: "payments",
        label:
          "利用中のカードの支払い・口座振替が滞りなく行われているか確認する",
        optional: false,
        official_link: null,
      },
      {
        id: "registered-info",
        label:
          "退職に伴って登録情報の変更手続きが必要か、カード会社の公式案内で確認する",
        optional: false,
        official_link: null,
      },
      {
        id: "new-application",
        label:
          "新規申込みや利用枠の変更は、各社の公式条件を確認してから検討する",
        optional: true,
        official_link: null,
      },
      {
        id: "accurate-info",
        label: "申込みでは、職業・収入を実際の状況のとおりに記載する",
        optional: false,
        official_link: null,
      },
    ],
  },
  {
    ...draft,
    slug: "housing-loan",
    title_ja: "住宅ローン・分割払いの確認事項",
    summary_ja:
      "住宅ローンや分割払いを検討するときに確認したいことを整理する予定です。",
    category: "loan",
    sources: [],
    limitations: [],
    thumbnail_asset_id: null,
    outline_ja: [],
    checklist: [],
  },
  {
    ...draft,
    slug: "insurance-pension",
    title_ja: "退職後の社会保険・年金の確認事項",
    summary_ja:
      "退職後の健康保険・年金の手続きで確認したいことを整理する予定です。",
    category: "insurance",
    sources: [],
    limitations: [],
    thumbnail_asset_id: null,
    outline_ja: [],
    checklist: [],
  },
  {
    ...draft,
    slug: "asset-documents",
    title_ja: "資産・収入資料の整理チェックリスト",
    summary_ja:
      "資産や収入に関する資料を整理するためのチェックリストを用意する予定です。",
    category: "documents",
    sources: [],
    limitations: [],
    thumbnail_asset_id: null,
    outline_ja: [],
    checklist: [],
  },
];

/** ビルド時にスキーマを検証する。不正なデータは公開前に失敗させる */
export const GUIDES: Guide[] = GUIDE_ENTRIES.map((guide) =>
  guideSchema.parse(guide),
);

export function isPublished(guide: Guide): boolean {
  return guide.status === "published";
}

/** 未公開だが、構成とチェックリストを noindex のプレビューで見せられるもの */
export function isPreviewable(guide: Guide): boolean {
  return (
    !isPublished(guide) &&
    guide.outline_ja.length > 0 &&
    guide.thumbnail_asset_id !== null
  );
}

export function findGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
