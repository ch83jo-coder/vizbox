import type {
  EarliestFire,
  EngineInput,
  Projection,
  ProjectionPoint,
} from "./types";

/** rm = (1+r)^(1/12) - 1 */
export function monthlyRate(annualRate: number): number {
  return (1 + annualRate) ** (1 / 12) - 1;
}

/** F(t) = (1+i)^(t/12) */
export function inflationFactor(
  annualInflation: number,
  month: number,
): number {
  return (1 + annualInflation) ** (month / 12);
}

/** 画面参考用。名目モデルに再適用しない */
export function realReturnDisplay(
  annualReturn: number,
  annualInflation: number,
): number {
  return (1 + annualReturn) / (1 + annualInflation) - 1;
}

function assertComputable(input: EngineInput): void {
  const finite = Object.values(input).every(Number.isFinite);
  const months = (input.projectionEndAge - input.currentAge) * 12;
  const retirement = (input.targetRetirementAge - input.currentAge) * 12;
  if (
    !finite ||
    !Number.isInteger(months) ||
    !Number.isInteger(retirement) ||
    retirement < 0 ||
    months <= retirement ||
    input.withdrawalRate <= 0 ||
    input.annualNominalReturn <= -1 ||
    input.annualInflation <= -1
  ) {
    throw new RangeError("計算できない入力です");
  }
}

export function project(input: EngineInput): Projection {
  assertComputable(input);

  const T = (input.targetRetirementAge - input.currentAge) * 12;
  const H = (input.projectionEndAge - input.currentAge) * 12;
  const rm = monthlyRate(input.annualNominalReturn);
  const F = (t: number) => inflationFactor(input.annualInflation, t);

  const incomeStart = (input.postFireIncomeStartAge - input.currentAge) * 12;
  const incomeEnd = (input.postFireIncomeEndAge - input.currentAge) * 12;
  const isIncomeActive = (s: number) =>
    input.monthlyPostFireIncomeToday > 0 && s >= incomeStart && s < incomeEnd;

  const monthlyCostToday =
    input.monthlyExpensesToday + input.monthlyExtraCostsToday;
  /** 現在の購買力での必要資産の目安。t で収入が有効な場合のみ差し引く */
  const requiredTodayAt = (t: number) => {
    const income = isIncomeActive(t) ? input.monthlyPostFireIncomeToday : 0;
    return Math.max(0, 12 * (monthlyCostToday - income)) / input.withdrawalRate;
  };
  const requiredAt = (t: number) => requiredTodayAt(t) * F(t);

  const assets = new Array<number>(H + 1);
  assets[0] = input.investableAssets;
  for (let m = 1; m <= T; m++) {
    assets[m] = assets[m - 1] * (1 + rm) + input.monthlyContribution;
  }

  let depletionMonth: number | null = null;
  let firstShortfallMonth: number | null = null;
  let cashflowShortfallTotal = 0;
  for (let m = T + 1; m <= H; m++) {
    const s = m - 1;
    const expenses = monthlyCostToday * F(s);
    const income = isIncomeActive(s)
      ? input.monthlyPostFireIncomeToday * F(s)
      : 0;
    // 収入が支出を上回っても超過分は再投資しない
    const withdrawal = Math.max(0, expenses - income);
    const balance = assets[m - 1];

    if (withdrawal > 0 && withdrawal >= balance) {
      depletionMonth ??= s;
      if (withdrawal > balance) {
        firstShortfallMonth ??= s;
        cashflowShortfallTotal += withdrawal - balance;
      }
      assets[m] = 0;
    } else {
      assets[m] = (balance - withdrawal) * (1 + rm);
    }
  }

  const points: ProjectionPoint[] = assets.map((value, month) => ({
    month,
    assets: value,
    required: requiredAt(month),
    inflationFactor: F(month),
  }));

  const requiredToday = requiredTodayAt(T);
  const requiredAtRetirement = requiredToday * F(T);
  const balanceAtRetirement = assets[T];

  return {
    retirementMonth: T,
    horizonMonths: H,
    monthlyReturn: rm,
    realReturnDisplay: realReturnDisplay(
      input.annualNominalReturn,
      input.annualInflation,
    ),
    points,
    requiredToday,
    requiredAtRetirement,
    balanceAtRetirement,
    gapAtRetirement: Math.max(0, requiredAtRetirement - balanceAtRetirement),
    surplusAtRetirement: Math.max(
      0,
      balanceAtRetirement - requiredAtRetirement,
    ),
    progress:
      requiredAtRetirement > 0
        ? balanceAtRetirement / requiredAtRetirement
        : null,
    earliestFire: findEarliestFire(input, rm, H, requiredAt),
    depletionMonth,
    firstShortfallMonth,
    cashflowShortfallTotal,
    incomeEnd:
      isIncomeActive(T) && incomeEnd < H
        ? {
            month: incomeEnd,
            requiredToday:
              Math.max(0, 12 * monthlyCostToday) / input.withdrawalRate,
          }
        : null,
  };
}

/** 目標リタイア経路とは別に、積立を続ける経路 B[t] で単純基準 B[t] >= K[t] を探す */
function findEarliestFire(
  input: EngineInput,
  rm: number,
  horizon: number,
  requiredAt: (t: number) => number,
): EarliestFire {
  let balance = input.investableAssets;
  for (let t = 0; t < horizon; t++) {
    if (t > 0) balance = balance * (1 + rm) + input.monthlyContribution;
    if (balance >= requiredAt(t)) {
      return t === 0
        ? { status: "already", month: 0 }
        : { status: "reached", month: t };
    }
  }
  return { status: "not_reached", month: null };
}
