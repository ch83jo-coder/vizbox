import type { SimulatorField } from "@/lib/fire/schema";

export type FieldConfig = {
  name: SimulatorField;
  label: string;
  unit: "歳" | "万円" | "%";
  help?: string;
  /** Grid の sm 以上での幅（12分割） */
  smSize: 4 | 6 | 12;
  /** マイナスを入力できる項目（iOS の数字キーボードにはマイナスがない） */
  allowNegative?: boolean;
  /** 値が変わったときに再検証する項目 */
  deps?: SimulatorField[];
};

export type FieldGroup = {
  title: string;
  description?: string;
  fields: FieldConfig[];
};

export const FIELD_GROUPS: FieldGroup[] = [
  {
    title: "年齢",
    fields: [
      {
        name: "currentAge",
        label: "現在の年齢",
        unit: "歳",
        smSize: 4,
        deps: ["targetRetirementAge", "projectionEndAge"],
      },
      {
        name: "targetRetirementAge",
        label: "目標リタイア年齢",
        unit: "歳",
        smSize: 4,
        deps: ["projectionEndAge"],
      },
      {
        name: "projectionEndAge",
        label: "試算の最終年齢",
        unit: "歳",
        smSize: 4,
      },
    ],
  },
  {
    title: "資産と積立",
    fields: [
      {
        name: "investableAssetsMan",
        label: "運用可能資産",
        unit: "万円",
        help: "自宅など売却予定のない資産を除いた運用可能資産。",
        smSize: 12,
      },
      {
        name: "monthlyContributionMan",
        label: "毎月の積立額",
        unit: "万円",
        help: "リタイアまで毎月末に積み立てる額（手取りからの純貯蓄額）。将来も同じ金額と仮定します。",
        smSize: 12,
      },
    ],
  },
  {
    title: "生活費",
    fields: [
      {
        name: "monthlyExpensesMan",
        label: "現在の月額生活費",
        unit: "万円",
        help: "税金・保険料なども含めた現在の月額生活費を入力。追加費用欄との二重計上に注意。",
        smSize: 12,
      },
      {
        name: "monthlyExtraCostsMan",
        label: "追加の月額費用",
        unit: "万円",
        help: "生活費に含めていない税金・社会保険料・その他の固定費だけを入力。",
        smSize: 12,
      },
    ],
  },
  {
    title: "利回り・物価・取り崩し率",
    description:
      "利回りは手数料・税負担を考慮してご自身で設定する名目利回りです。税金の個別計算は行いません。取り崩し率は必要資産の目安に使う年間取り崩し率で、運用利回りや将来の保証ではありません。",
    fields: [
      {
        name: "annualReturnPct",
        label: "想定利回り（年）",
        unit: "%",
        smSize: 4,
        allowNegative: true,
      },
      {
        name: "annualInflationPct",
        label: "物価上昇率（年）",
        unit: "%",
        smSize: 4,
        allowNegative: true,
      },
      {
        name: "withdrawalRatePct",
        label: "取り崩し率（年）",
        unit: "%",
        smSize: 4,
      },
    ],
  },
  {
    title: "FIRE後の収入",
    description:
      "手取り収入。入力額は現在の購買力で、モデルでは物価連動と仮定。年金・副業をまとめた単一期間。",
    fields: [
      {
        name: "monthlyPostFireIncomeMan",
        label: "月額の収入",
        unit: "万円",
        smSize: 12,
      },
      {
        name: "postFireIncomeStartAge",
        label: "開始年齢",
        unit: "歳",
        smSize: 6,
        deps: ["postFireIncomeEndAge"],
      },
      {
        name: "postFireIncomeEndAge",
        label: "終了年齢",
        unit: "歳",
        help: "この年齢になった月から収入は含めません。",
        smSize: 6,
      },
    ],
  },
];

export const FIELD_LABELS = Object.fromEntries(
  FIELD_GROUPS.flatMap((group) =>
    group.fields.map((field) => [field.name, field.label]),
  ),
) as Record<SimulatorField, string>;
