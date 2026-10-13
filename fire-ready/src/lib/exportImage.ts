import { DISCLAIMER, RESULTS_COPY } from "./copy";
import { summaryAtRetirement, type ValueMode } from "./fire/display";
import type { SimulatorValues } from "./fire/schema";
import type { Projection } from "./fire/types";
import { formatAgeAt, formatPercentRatio, formatYen } from "./format";
import { tokens } from "./tokens";

export type SummaryImageOptions = {
  values: SimulatorValues;
  projection: Projection;
  mode: ValueMode;
  /** 金額（必要資産・予想資産・不足額・生活費など）を含める。既定は含めない */
  includeAmounts: boolean;
  createdAt: Date;
};

const WIDTH = 1080;
const PADDING = 96;
const CONTENT_WIDTH = WIDTH - PADDING * 2;

const dateFormat = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "long",
  timeZone: "Asia/Tokyo",
});

/** 日本語は単語区切りがないため1文字ずつ測って折り返す */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxWidth && line !== "") {
      lines.push(line);
      line = ch;
    } else {
      line += ch;
    }
  }
  if (line !== "") lines.push(line);
  return lines;
}

export function summaryRows(options: SummaryImageOptions): [string, string][] {
  const { values, projection, mode, includeAmounts } = options;
  const { earliestFire, depletionMonth, progress } = projection;
  const earliest =
    earliestFire.status === "already"
      ? "現在すでに満たしています"
      : earliestFire.status === "reached"
        ? formatAgeAt(values.currentAge, earliestFire.month)
        : RESULTS_COPY.notReached;
  const depletion =
    depletionMonth === null
      ? `${values.projectionEndAge}歳まで資産が残ります`
      : formatAgeAt(values.currentAge, depletionMonth);
  const rows: [string, string][] = [
    [RESULTS_COPY.earliest, earliest],
    [RESULTS_COPY.depletion, depletion],
    [
      "目標時点の達成率",
      progress === null
        ? "—（必要資産の目安が0円）"
        : formatPercentRatio(progress),
    ],
  ];
  if (includeAmounts) {
    const summary = summaryAtRetirement(projection, mode);
    rows.push(
      [RESULTS_COPY.required, formatYen(summary.required)],
      [RESULTS_COPY.targetBalance, formatYen(summary.balance)],
      [RESULTS_COPY.gap, summary.gap > 0 ? formatYen(summary.gap) : "不足なし"],
    );
  }
  return rows;
}

const man = (value: number) => `${value.toLocaleString("ja-JP")}万円`;

function assumptionLines(options: SummaryImageOptions): string[] {
  const { values, includeAmounts } = options;
  const lines = [
    `現在${values.currentAge}歳 → 目標リタイア${values.targetRetirementAge}歳（${values.projectionEndAge}歳まで試算）`,
    `想定利回り 年${values.annualReturnPct}%・物価上昇率 年${values.annualInflationPct}%・取り崩し率 ${values.withdrawalRatePct}%`,
  ];
  if (includeAmounts) {
    lines.push(
      `運用可能資産 ${man(values.investableAssetsMan)}・毎月の積立 ${man(values.monthlyContributionMan)}`,
      `月額生活費 ${man(values.monthlyExpensesMan)}・追加の月額費用 ${man(values.monthlyExtraCostsMan)}`,
      `FIRE後の月額収入 ${man(values.monthlyPostFireIncomeMan)}（${values.postFireIncomeStartAge}〜${values.postFireIncomeEndAge}歳）`,
    );
  } else {
    lines.push("資産・積立・生活費などの金額は、この画像に含めていません。");
  }
  return lines;
}

/** 試算サマリーを PNG にする。日本語フォントの読み込み完了を待ってから描画する */
export async function renderSummaryPng(
  options: SummaryImageOptions,
): Promise<Blob> {
  await document.fonts.ready;
  const fontFamily = getComputedStyle(document.body).fontFamily;
  const font = (weight: number, size: number) =>
    `${weight} ${size}px ${fontFamily}`;

  const measureCanvas = document.createElement("canvas");
  const measure = measureCanvas.getContext("2d");
  if (!measure) throw new Error("このブラウザーでは画像を作成できません");

  measure.font = font(400, 24);
  const disclaimerLines = wrapText(measure, DISCLAIMER, CONTENT_WIDTH);
  measure.font = font(400, 26);
  const assumptions = assumptionLines(options).flatMap((line) =>
    wrapText(measure, line, CONTENT_WIDTH - 28),
  );
  const rows = summaryRows(options);
  const height =
    PADDING +
    250 +
    rows.length * 96 +
    90 +
    assumptions.length * 42 +
    60 +
    disclaimerLines.length * 36 +
    PADDING;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("このブラウザーでは画像を作成できません");

  ctx.fillStyle = tokens.background;
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.fillStyle = tokens.surface;
  ctx.strokeStyle = tokens.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(40, 40, WIDTH - 80, height - 80, 32);
  ctx.fill();
  ctx.stroke();

  ctx.textBaseline = "alphabetic";
  let y = PADDING + 36;
  ctx.fillStyle = tokens.primary;
  ctx.font = font(700, 28);
  ctx.fillText("FIRE READY", PADDING, y);

  y += 70;
  ctx.fillStyle = tokens.text;
  ctx.font = font(700, 46);
  ctx.fillText("FIREシミュレーション 試算サマリー", PADDING, y);

  y += 52;
  ctx.fillStyle = tokens.muted;
  ctx.font = font(400, 26);
  const modeLabel =
    options.mode === "real"
      ? "金額は現在の購買力で表示"
      : "金額は名目（将来の円）で表示";
  ctx.fillText(
    `基準日 ${dateFormat.format(options.createdAt)}${options.includeAmounts ? `・${modeLabel}` : ""}`,
    PADDING,
    y,
  );

  y += 40;
  ctx.fillStyle = tokens.accent;
  ctx.fillRect(PADDING, y, CONTENT_WIDTH, 2);

  for (const [label, value] of rows) {
    y += 52;
    ctx.fillStyle = tokens.muted;
    ctx.font = font(500, 26);
    ctx.fillText(label, PADDING, y);
    y += 44;
    ctx.fillStyle = tokens.text;
    ctx.font = font(700, 36);
    ctx.fillText(value, PADDING, y);
  }

  y += 80;
  ctx.fillStyle = tokens.text;
  ctx.font = font(700, 28);
  ctx.fillText("主な仮定", PADDING, y);
  ctx.fillStyle = tokens.muted;
  ctx.font = font(400, 26);
  for (const line of assumptions) {
    y += 42;
    ctx.fillText(line, PADDING + 28, y);
  }

  y += 60;
  ctx.font = font(400, 24);
  for (const line of disclaimerLines) {
    y += 36;
    ctx.fillText(line, PADDING, y);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("画像を作成できませんでした")),
      "image/png",
    );
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
