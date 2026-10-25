const integer = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 });

/** 円 → 「8,571万円」「1億2,345万円」「5,000円」 */
export function formatYen(yen: number): string {
  if (!Number.isFinite(yen)) return "—";
  const sign = yen < 0 ? "−" : "";
  const abs = Math.abs(yen);
  if (abs < 10_000) return `${sign}${integer.format(abs)}円`;
  const man = Math.round(abs / 10_000);
  if (man < 10_000) return `${sign}${integer.format(man)}万円`;
  const oku = Math.floor(man / 10_000);
  const rest = man % 10_000;
  return `${sign}${oku}億${rest > 0 ? `${integer.format(rest)}万` : ""}円`;
}

/** チャート軸用の短い表記 */
export function formatYenAxis(yen: number): string {
  const abs = Math.abs(yen);
  if (abs >= 100_000_000) return `${Number((yen / 100_000_000).toFixed(1))}億`;
  if (abs >= 10_000) return `${integer.format(yen / 10_000)}万`;
  return integer.format(yen);
}

/** 月数 → 「10年3か月」 */
export function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest}か月`;
  return rest === 0 ? `${years}年` : `${years}年${rest}か月`;
}

/** 現在の年齢と月数 → 「52歳3か月」 */
export function formatAgeAt(currentAge: number, month: number): string {
  const years = currentAge + Math.floor(month / 12);
  const rest = month % 12;
  return rest === 0 ? `${years}歳` : `${years}歳${rest}か月`;
}

/** 小数の率 → 「3.5%」 */
export function formatRate(rate: number): string {
  return `${Number((rate * 100).toFixed(2))}%`;
}

export function formatPercentRatio(ratio: number): string {
  return `${integer.format(ratio * 100)}%`;
}
