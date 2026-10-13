import { describe, expect, it } from "vitest";
import { summaryAtRetirement, toChartRows } from "./display";
import { monthlyRate, project } from "./engine";
import { buildScenarios } from "./scenarios";
import {
  DEFAULT_VALUES,
  simulatorFormSchema,
  toEngineInput,
  toFormInput,
} from "./schema";
import type { EngineInput, Projection } from "./types";

const input = (overrides: Partial<EngineInput> = {}): EngineInput => ({
  currentAge: 40,
  targetRetirementAge: 50,
  projectionEndAge: 95,
  investableAssets: 30_000_000,
  monthlyContribution: 200_000,
  monthlyExpensesToday: 250_000,
  monthlyExtraCostsToday: 0,
  annualNominalReturn: 0,
  annualInflation: 0,
  withdrawalRate: 0.04,
  monthlyPostFireIncomeToday: 0,
  postFireIncomeStartAge: 50,
  postFireIncomeEndAge: 95,
  ...overrides,
});

const assetsAt = (p: Projection, month: number) => p.points[month].assets;

function expectNoNaN(p: Projection) {
  for (const point of p.points) {
    expect(Number.isFinite(point.assets)).toBe(true);
    expect(point.assets).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(point.required)).toBe(true);
  }
}

describe("必要資産の目安 K0 / KT", () => {
  it("月250000円・w=4% → 75,000,000円", () => {
    expect(project(input()).requiredToday).toBeCloseTo(75_000_000, 2);
  });

  it("w=3.5% → 85,714,285.71428572円（誤差0.01円以内）", () => {
    const k0 = project(input({ withdrawalRate: 0.035 })).requiredToday;
    expect(Math.abs(k0 - 85_714_285.71428572)).toBeLessThan(0.01);
  });

  it("退職時点で有効な収入150000円を差し引く → 30,000,000円", () => {
    const p = project(input({ monthlyPostFireIncomeToday: 150_000 }));
    expect(p.requiredToday).toBeCloseTo(30_000_000, 2);
  });

  it("退職後に始まる収入は K0 から差し引かない", () => {
    const p = project(
      input({
        monthlyPostFireIncomeToday: 150_000,
        postFireIncomeStartAge: 65,
      }),
    );
    expect(p.requiredToday).toBeCloseTo(75_000_000, 2);
  });

  it("i=2%・T=120 → KT = K0 × 1.02^10", () => {
    const p = project(input({ annualInflation: 0.02 }));
    expect(p.retirementMonth).toBe(120);
    expect(p.requiredAtRetirement).toBeCloseTo(p.requiredToday * 1.02 ** 10, 4);
  });
});

describe("積立と取り崩し", () => {
  it("r=i=0・A0=3000万・C=20万・T=120 → A[T]=5400万", () => {
    expect(assetsAt(project(input()), 120)).toBe(54_000_000);
  });

  it("同条件で退職後12か月 → A[T+12]=5100万", () => {
    expect(assetsAt(project(input()), 132)).toBe(51_000_000);
  });

  it("月次利回りは (1.05)^(1/12)-1 を使う", () => {
    const rm = 1.05 ** (1 / 12) - 1;
    expect(monthlyRate(0.05)).toBe(rm);
    const p = project(input({ annualNominalReturn: 0.05 }));
    expect(p.monthlyReturn).toBe(rm);
    expect(assetsAt(p, 1)).toBeCloseTo(30_000_000 * (1 + rm) + 200_000, 6);
    // 年12回の複利で年率5%に一致する（積立なし）
    const noContribution = project(
      input({ annualNominalReturn: 0.05, monthlyContribution: 0 }),
    );
    expect(assetsAt(noContribution, 12)).toBeCloseTo(30_000_000 * 1.05, 4);
  });

  it("退職後は月初に取り崩してから運用する", () => {
    const rm = monthlyRate(0.05);
    const p = project(
      input({ annualNominalReturn: 0.05, targetRetirementAge: 40 }),
    );
    expect(assetsAt(p, 1)).toBeCloseTo((30_000_000 - 250_000) * (1 + rm), 6);
  });

  it("収入が支出を上回っても超過分は再投資しない", () => {
    const p = project(
      input({
        monthlyPostFireIncomeToday: 400_000,
        targetRetirementAge: 40,
        postFireIncomeStartAge: 40,
      }),
    );
    expect(assetsAt(p, 24)).toBe(30_000_000);
  });
});

describe("現在リタイア（T=0）と単純基準", () => {
  it("T=0 でも計算でき、A[0]=A0", () => {
    const p = project(input({ targetRetirementAge: 40 }));
    expect(p.retirementMonth).toBe(0);
    expect(p.balanceAtRetirement).toBe(30_000_000);
    expect(assetsAt(p, 1)).toBe(29_750_000);
  });

  it("現在すでに基準を満たす", () => {
    const p = project(input({ investableAssets: 80_000_000 }));
    expect(p.earliestFire).toEqual({ status: "already", month: 0 });
  });

  it("積立経路で基準を満たす月を返す", () => {
    // B[t] = 3000万 + 20万t >= 7500万 → t = 225
    const p = project(input());
    expect(p.earliestFire).toEqual({ status: "reached", month: 225 });
  });

  it("設定期間内では未到達", () => {
    const p = project(input({ investableAssets: 0, monthlyContribution: 0 }));
    expect(p.earliestFire).toEqual({ status: "not_reached", month: null });
  });
});

describe("収入期間", () => {
  it("終了月は含まない（半開区間）、終了後は取り崩し額が増える", () => {
    const p = project(
      input({
        currentAge: 50,
        targetRetirementAge: 50,
        projectionEndAge: 70,
        investableAssets: 50_000_000,
        monthlyPostFireIncomeToday: 150_000,
        postFireIncomeStartAge: 50,
        postFireIncomeEndAge: 60,
      }),
    );
    // s=0..119 は 10万円、s=120 から 25万円
    expect(assetsAt(p, 120)).toBe(50_000_000 - 120 * 100_000);
    expect(assetsAt(p, 121)).toBe(50_000_000 - 120 * 100_000 - 250_000);
    expect(p.incomeEnd).toEqual({ month: 120, requiredToday: 75_000_000 });
    expect(p.points[119].required).toBeCloseTo(30_000_000, 2);
    expect(p.points[120].required).toBeCloseTo(75_000_000, 2);
  });
});

describe("境界値", () => {
  it("資産0・費用0 → 必要資産0・progress null・基準充足", () => {
    const p = project(
      input({
        investableAssets: 0,
        monthlyContribution: 0,
        monthlyExpensesToday: 0,
      }),
    );
    expect(p.requiredAtRetirement).toBe(0);
    expect(p.progress).toBeNull();
    expect(p.earliestFire.status).toBe("already");
    expect(p.depletionMonth).toBeNull();
    expectNoNaN(p);
  });

  it("収入 >= 費用 → 必要資産0、資産は減らない", () => {
    const p = project(input({ monthlyPostFireIncomeToday: 250_000 }));
    expect(p.requiredToday).toBe(0);
    expect(p.progress).toBeNull();
    expect(p.depletionMonth).toBeNull();
    expectNoNaN(p);
  });

  it("利回りマイナス・物価マイナスでも NaN にならない", () => {
    const p = project(
      input({ annualNominalReturn: -0.2, annualInflation: -0.02 }),
    );
    expect(p.points[12].inflationFactor).toBeCloseTo(0.98, 10);
    expect(assetsAt(p, 12)).toBeLessThan(30_000_000 + 12 * 200_000);
    expectNoNaN(p);
  });
});

describe("資産の枯渇", () => {
  const depleting = input({
    targetRetirementAge: 40,
    investableAssets: 1_000_000,
    monthlyContribution: 0,
  });

  it("D = A のとき支出はまかなえ、資産0到達を記録", () => {
    const p = project(depleting);
    // s=0,1,2 で 75万→50万→25万、s=3 で 25万を取り崩して 0
    expect(p.depletionMonth).toBe(3);
    expect(assetsAt(p, 4)).toBe(0);
  });

  it("D > A で不足を記録、残高は0のまま、NaNなし", () => {
    const p = project(depleting);
    expect(p.firstShortfallMonth).toBe(4);
    expect(p.cashflowShortfallTotal).toBe((p.horizonMonths - 4) * 250_000);
    expectNoNaN(p);
  });

  it("後から収入が始まっても最初の枯渇時期は消えない", () => {
    const p = project({
      ...depleting,
      monthlyPostFireIncomeToday: 300_000,
      postFireIncomeStartAge: 45,
    });
    expect(p.depletionMonth).toBe(3);
    expect(assetsAt(p, p.horizonMonths)).toBe(0);
  });
});

describe("表示モードとシナリオ", () => {
  const values = { ...DEFAULT_VALUES };
  const engineInput = toEngineInput(values);
  const scenarios = buildScenarios(engineInput);
  const base = scenarios[1].projection;

  for (const mode of ["real", "nominal"] as const) {
    it(`${mode}: チャートの目標時点とカードの値が一致する`, () => {
      const rows = toChartRows(scenarios, values.currentAge, mode);
      const row = rows.find((r) => r.month === base.retirementMonth);
      const summary = summaryAtRetirement(base, mode);
      expect(row?.base).toBe(summary.balance);
      expect(row?.required).toBe(summary.required);
    });
  }

  it("real の必要資産は K0 と一致、nominal は KT", () => {
    expect(summaryAtRetirement(base, "real").required).toBeCloseTo(
      base.requiredToday,
      4,
    );
    expect(summaryAtRetirement(base, "nominal").required).toBe(
      base.requiredAtRetirement,
    );
  });

  it("シナリオは利回り ±2%pt、範囲外は調整", () => {
    expect(scenarios.map((s) => s.annualReturn)).toEqual([
      expect.closeTo(0.03, 10),
      0.05,
      expect.closeTo(0.07, 10),
    ]);
    const clamped = buildScenarios({
      ...engineInput,
      annualNominalReturn: 0.19,
    });
    expect(clamped[2]).toMatchObject({ annualReturn: 0.2, adjusted: true });
    expect(clamped[0].adjusted).toBe(false);
  });
});

describe("単位変換", () => {
  it("万円 → 円、% → 小数を一度だけ変換する", () => {
    const e = toEngineInput(DEFAULT_VALUES);
    expect(e.investableAssets).toBe(30_000_000);
    expect(e.monthlyContribution).toBe(200_000);
    expect(e.monthlyExpensesToday).toBe(250_000);
    expect(e.annualNominalReturn).toBe(0.05);
    expect(e.annualInflation).toBe(0.02);
    expect(e.withdrawalRate).toBe(0.035);
  });

  it("フォーム文字列 → 画面単位の数値（全角・カンマ対応）", () => {
    const parsed = simulatorFormSchema.parse({
      ...toFormInput(DEFAULT_VALUES),
      investableAssetsMan: "３，０００",
      annualReturnPct: "5.5",
    });
    expect(parsed.investableAssetsMan).toBe(3000);
    expect(parsed.annualReturnPct).toBe(5.5);
  });

  it("空欄は0にせず日本語エラー", () => {
    const result = simulatorFormSchema.safeParse({
      ...toFormInput(DEFAULT_VALUES),
      monthlyExpensesMan: "",
      withdrawalRatePct: "0",
      targetRetirementAge: "abc",
    });
    expect(result.success).toBe(false);
    const messages = Object.fromEntries(
      (result.error?.issues ?? []).map((issue) => [
        issue.path.join("."),
        issue.message,
      ]),
    );
    expect(messages.monthlyExpensesMan).toBe("入力してください");
    expect(messages.withdrawalRatePct).toBe("1%以上で入力してください");
    expect(messages.targetRetirementAge).toBe("数値で入力してください");
  });

  it("年齢の関係を検証する", () => {
    const result = simulatorFormSchema.safeParse({
      ...toFormInput(DEFAULT_VALUES),
      targetRetirementAge: "35",
      projectionEndAge: "40",
    });
    const paths = result.error?.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(["targetRetirementAge", "projectionEndAge"]);
  });

  it("ほかの項目にエラーがあっても年齢の関係を検証する", () => {
    const result = simulatorFormSchema.safeParse({
      ...toFormInput(DEFAULT_VALUES),
      monthlyExpensesMan: "",
      targetRetirementAge: "30",
    });
    const paths = result.error?.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(["monthlyExpensesMan", "targetRetirementAge"]);
  });
});
