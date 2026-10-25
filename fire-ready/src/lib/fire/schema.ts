import { z } from "zod";
import type { EngineInput } from "./types";

/** 画面の単位（万円・%・歳）での入力値 */
export type SimulatorValues = {
  currentAge: number;
  targetRetirementAge: number;
  projectionEndAge: number;
  investableAssetsMan: number;
  monthlyContributionMan: number;
  monthlyExpensesMan: number;
  monthlyExtraCostsMan: number;
  annualReturnPct: number;
  annualInflationPct: number;
  withdrawalRatePct: number;
  monthlyPostFireIncomeMan: number;
  postFireIncomeStartAge: number;
  postFireIncomeEndAge: number;
};

export type SimulatorField = keyof SimulatorValues;

/** 計算できる範囲の上限・下限。経済的な判断基準ではない */
export const LIMITS = {
  assetsMaxMan: 1_000_000,
  monthlyMaxMan: 1_000,
  returnPct: { min: -20, max: 20 },
  inflationPct: { min: -2, max: 10 },
  withdrawalPct: { min: 1, max: 8 },
} as const;

export const MAN_YEN = 10_000;

export const DEFAULT_VALUES: SimulatorValues = {
  currentAge: 40,
  targetRetirementAge: 50,
  projectionEndAge: 95,
  investableAssetsMan: 3000,
  monthlyContributionMan: 20,
  monthlyExpensesMan: 25,
  monthlyExtraCostsMan: 0,
  annualReturnPct: 5,
  annualInflationPct: 2,
  withdrawalRatePct: 3.5,
  monthlyPostFireIncomeMan: 0,
  postFireIncomeStartAge: 50,
  postFireIncomeEndAge: 95,
};

const age = (min: number, max: number) =>
  z
    .number()
    .int("整数で入力してください")
    .min(min, `${min}歳以上で入力してください`)
    .max(max, `${max}歳以下で入力してください`);

const manYen = (max: number) =>
  z
    .number()
    .min(0, "0以上で入力してください")
    .max(
      max,
      `${max.toLocaleString("ja-JP")}万円以下で入力してください（計算できる範囲の上限です）`,
    );

const percent = ({ min, max }: { min: number; max: number }) =>
  z
    .number()
    .min(min, `${min}%以上で入力してください`)
    .max(max, `${max}%以下で入力してください`);

const fieldSchemas = {
  currentAge: age(18, 90),
  targetRetirementAge: age(18, 100),
  projectionEndAge: age(19, 110),
  investableAssetsMan: manYen(LIMITS.assetsMaxMan),
  monthlyContributionMan: manYen(LIMITS.monthlyMaxMan),
  monthlyExpensesMan: manYen(LIMITS.monthlyMaxMan),
  monthlyExtraCostsMan: manYen(LIMITS.monthlyMaxMan),
  annualReturnPct: percent(LIMITS.returnPct),
  annualInflationPct: percent(LIMITS.inflationPct),
  withdrawalRatePct: percent(LIMITS.withdrawalPct),
  monthlyPostFireIncomeMan: manYen(LIMITS.monthlyMaxMan),
  postFireIncomeStartAge: age(18, 110),
  postFireIncomeEndAge: age(18, 110),
} satisfies Record<SimulatorField, z.ZodNumber>;

/** 関係チェックの issue の印。項目自体のエラーと区別する */
const RELATION_ISSUE = { relation: true } as const;

type Relation = {
  /** この項目がすべて正しく読めたときだけ確認する（ほかの項目のエラーとは独立） */
  fields: SimulatorField[];
  check: (values: SimulatorValues, ctx: z.RefinementCtx) => void;
};

const RELATIONS: Relation[] = [
  {
    fields: ["currentAge", "targetRetirementAge"],
    check: (values, ctx) => {
      if (values.targetRetirementAge < values.currentAge) {
        ctx.addIssue({
          code: "custom",
          params: RELATION_ISSUE,
          path: ["targetRetirementAge"],
          message: "現在の年齢以上で入力してください",
        });
      }
    },
  },
  {
    fields: ["currentAge", "targetRetirementAge", "projectionEndAge"],
    check: (values, ctx) => {
      const minEnd =
        Math.max(values.currentAge, values.targetRetirementAge) + 1;
      if (values.projectionEndAge < minEnd) {
        ctx.addIssue({
          code: "custom",
          params: RELATION_ISSUE,
          path: ["projectionEndAge"],
          message: `${minEnd}歳以上で入力してください（現在・目標の年齢より後）`,
        });
      }
    },
  },
  {
    fields: ["postFireIncomeStartAge", "postFireIncomeEndAge"],
    check: (values, ctx) => {
      if (values.postFireIncomeStartAge > values.postFireIncomeEndAge) {
        ctx.addIssue({
          code: "custom",
          params: RELATION_ISSUE,
          path: ["postFireIncomeEndAge"],
          message: "収入の開始年齢以上で入力してください",
        });
      }
    },
  },
];

function withRelations<T extends z.ZodType<SimulatorValues, unknown>>(
  schema: T,
): T {
  return RELATIONS.reduce(
    (current, relation) =>
      current.superRefine(relation.check, {
        when: (payload) =>
          !payload.issues.some(
            (issue) =>
              !(issue.code === "custom" && issue.params?.relation === true) &&
              relation.fields.some((field) => issue.path?.[0] === field),
          ),
      }),
    schema,
  );
}

/** 保存データ・共有リンクなど外部から来た数値の検証 */
export const simulatorValuesSchema = withRelations(z.object(fieldSchemas));

const FULL_WIDTH = /[０-９．－ー−]/g;
const FULL_WIDTH_MAP: Record<string, string> = {
  "．": ".",
  "－": "-",
  ー: "-",
  "−": "-",
};

/** 全角数字・カンマ・空白を正規化する */
export function normalizeNumberText(raw: string): string {
  return raw
    .replace(
      FULL_WIDTH,
      (ch) =>
        FULL_WIDTH_MAP[ch] ?? String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
    )
    .replace(/[,，\s]/g, "");
}

const numericText = z.string().transform((raw, ctx) => {
  const text = normalizeNumberText(raw);
  if (text === "") {
    ctx.addIssue({ code: "custom", message: "入力してください" });
    return z.NEVER;
  }
  if (!/^-?\d+(\.\d+)?$/.test(text)) {
    ctx.addIssue({ code: "custom", message: "数値で入力してください" });
    return z.NEVER;
  }
  return Number(text);
});

type FormShape = {
  [K in SimulatorField]: z.ZodPipe<
    typeof numericText,
    (typeof fieldSchemas)[K]
  >;
};

const formShape = Object.fromEntries(
  Object.entries(fieldSchemas).map(([key, schema]) => [
    key,
    numericText.pipe(schema),
  ]),
) as FormShape;

/** フォームの文字列入力 → 画面単位の数値 */
export const simulatorFormSchema = withRelations(z.object(formShape));

export type SimulatorFormInput = z.input<typeof simulatorFormSchema>;

export function toFormInput(values: SimulatorValues): SimulatorFormInput {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, String(value)]),
  ) as SimulatorFormInput;
}

export const manToYen = (man: number) => man * MAN_YEN;
export const percentToRate = (percent: number) => percent / 100;

/** 画面単位 → エンジン単位（円・小数）。変換はここで一度だけ行う */
export function toEngineInput(values: SimulatorValues): EngineInput {
  return {
    currentAge: values.currentAge,
    targetRetirementAge: values.targetRetirementAge,
    projectionEndAge: values.projectionEndAge,
    investableAssets: manToYen(values.investableAssetsMan),
    monthlyContribution: manToYen(values.monthlyContributionMan),
    monthlyExpensesToday: manToYen(values.monthlyExpensesMan),
    monthlyExtraCostsToday: manToYen(values.monthlyExtraCostsMan),
    annualNominalReturn: percentToRate(values.annualReturnPct),
    annualInflation: percentToRate(values.annualInflationPct),
    withdrawalRate: percentToRate(values.withdrawalRatePct),
    monthlyPostFireIncomeToday: manToYen(values.monthlyPostFireIncomeMan),
    postFireIncomeStartAge: values.postFireIncomeStartAge,
    postFireIncomeEndAge: values.postFireIncomeEndAge,
  };
}
