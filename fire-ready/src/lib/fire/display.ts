import type { Scenario, ScenarioId } from "./scenarios";
import type { Projection } from "./types";

/** real = 現在の購買力、nominal = 名目（将来の円） */
export type ValueMode = "real" | "nominal";

export function toDisplayValue(
  nominal: number,
  inflationFactor: number,
  mode: ValueMode,
): number {
  return mode === "real" ? nominal / inflationFactor : nominal;
}

export type SummaryValues = {
  required: number;
  balance: number;
  gap: number;
  surplus: number;
};

/** 結果カードの値。チャートと同じ変換を使う */
export function summaryAtRetirement(
  projection: Projection,
  mode: ValueMode,
): SummaryValues {
  const factor = projection.points[projection.retirementMonth].inflationFactor;
  return {
    required: toDisplayValue(projection.requiredAtRetirement, factor, mode),
    balance: toDisplayValue(projection.balanceAtRetirement, factor, mode),
    gap: toDisplayValue(projection.gapAtRetirement, factor, mode),
    surplus: toDisplayValue(projection.surplusAtRetirement, factor, mode),
  };
}

export type ChartRow = {
  month: number;
  age: number;
  required: number;
} & Record<ScenarioId, number>;

/** 年単位（12か月ごと）と最終月の行 */
export function toChartRows(
  scenarios: Scenario[],
  currentAge: number,
  mode: ValueMode,
): ChartRow[] {
  const base = scenarios.find((s) => s.id === "base") ?? scenarios[0];
  const horizon = base.projection.horizonMonths;
  const rows: ChartRow[] = [];
  for (let month = 0; month <= horizon; month += 12) {
    rows.push(rowAt(scenarios, base, month, currentAge, mode));
  }
  if (horizon % 12 !== 0)
    rows.push(rowAt(scenarios, base, horizon, currentAge, mode));
  return rows;
}

function rowAt(
  scenarios: Scenario[],
  base: Scenario,
  month: number,
  currentAge: number,
  mode: ValueMode,
): ChartRow {
  const point = base.projection.points[month];
  const value = (id: ScenarioId) => {
    const p = (scenarios.find((s) => s.id === id) ?? base).projection.points[
      month
    ];
    return toDisplayValue(p.assets, p.inflationFactor, mode);
  };
  return {
    month,
    age: currentAge + month / 12,
    required: toDisplayValue(point.required, point.inflationFactor, mode),
    conservative: value("conservative"),
    base: value("base"),
    optimistic: value("optimistic"),
  };
}
