/** エンジン入力。金額はすべて円、率は小数（5% = 0.05）。 */
export type EngineInput = {
  currentAge: number;
  targetRetirementAge: number;
  projectionEndAge: number;
  investableAssets: number;
  /** 月末に積み立てる名目固定額 */
  monthlyContribution: number;
  /** 現在の購買力での月額生活費 */
  monthlyExpensesToday: number;
  /** 生活費に含めていない税・社会保険などの月額（現在の購買力） */
  monthlyExtraCostsToday: number;
  annualNominalReturn: number;
  annualInflation: number;
  withdrawalRate: number;
  /** FIRE後の月額手取り収入（現在の購買力、物価連動） */
  monthlyPostFireIncomeToday: number;
  postFireIncomeStartAge: number;
  /** この年齢の月から収入は含まれない（半開区間） */
  postFireIncomeEndAge: number;
};

export type ProjectionPoint = {
  /** t（現在からの月数） */
  month: number;
  /** A[t] 名目円 */
  assets: number;
  /** K[t] その時点で退職した場合の必要資産の目安（名目円） */
  required: number;
  /** F(t) */
  inflationFactor: number;
};

export type EarliestFire =
  | { status: "already"; month: 0 }
  | { status: "reached"; month: number }
  | { status: "not_reached"; month: null };

export type Projection = {
  /** T */
  retirementMonth: number;
  /** H */
  horizonMonths: number;
  monthlyReturn: number;
  /** 画面参考用の実質利回り。モデルには再適用しない */
  realReturnDisplay: number;
  /** t = 0..H */
  points: ProjectionPoint[];
  /** K0 現在の購買力での必要資産の目安 */
  requiredToday: number;
  /** KT 目標時点の必要資産の目安（名目） */
  requiredAtRetirement: number;
  /** A[T] */
  balanceAtRetirement: number;
  gapAtRetirement: number;
  surplusAtRetirement: number;
  /** A[T] / KT。KT = 0 なら null */
  progress: number | null;
  earliestFire: EarliestFire;
  /** 取り崩しで資産が 0 に達した最初の月 s */
  depletionMonth: number | null;
  /** 月初の取り崩し額が資産を上回った最初の月 s */
  firstShortfallMonth: number | null;
  /** まかなえなかった支出の合計（名目円） */
  cashflowShortfallTotal: number;
  /** 退職時点で有効な収入が期間内に終わる場合、終了月と終了後の必要資産の目安（現在の購買力） */
  incomeEnd: { month: number; requiredToday: number } | null;
};
