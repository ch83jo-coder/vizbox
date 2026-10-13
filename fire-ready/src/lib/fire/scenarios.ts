import { project } from "./engine";
import { LIMITS, percentToRate } from "./schema";
import type { EngineInput, Projection } from "./types";

export type ScenarioId = "conservative" | "base" | "optimistic";

export type Scenario = {
  id: ScenarioId;
  label: string;
  annualReturn: number;
  /** 入力範囲を超えたため利回りを調整した */
  adjusted: boolean;
  projection: Projection;
};

const SCENARIO_DEFS: { id: ScenarioId; label: string; delta: number }[] = [
  { id: "conservative", label: "利回り低め", delta: -0.02 },
  { id: "base", label: "基準", delta: 0 },
  { id: "optimistic", label: "利回り高め", delta: 0.02 },
];

const RETURN_MIN = percentToRate(LIMITS.returnPct.min);
const RETURN_MAX = percentToRate(LIMITS.returnPct.max);

/** 利回りだけを ±2%pt 変えた仮定の比較。確率や最悪・最善の保証ではない */
export function buildScenarios(input: EngineInput): Scenario[] {
  return SCENARIO_DEFS.map(({ id, label, delta }) => {
    const raw = input.annualNominalReturn + delta;
    const annualReturn = Math.min(RETURN_MAX, Math.max(RETURN_MIN, raw));
    return {
      id,
      label,
      annualReturn,
      adjusted: annualReturn !== raw,
      projection: project({ ...input, annualNominalReturn: annualReturn }),
    };
  });
}
