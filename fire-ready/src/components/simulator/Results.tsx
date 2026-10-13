"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { DISCLAIMER, RESULTS_COPY } from "@/lib/copy";
import {
  summaryAtRetirement,
  toDisplayValue,
  type ValueMode,
} from "@/lib/fire/display";
import type { Scenario } from "@/lib/fire/scenarios";
import type { SimulatorValues } from "@/lib/fire/schema";
import type { Projection } from "@/lib/fire/types";
import {
  formatAgeAt,
  formatDuration,
  formatPercentRatio,
  formatYen,
} from "@/lib/format";
import { FIELD_LABELS } from "./fields";
import type { FieldIssue } from "./useSimulator";

type ResultsProps = {
  scenarios: Scenario[] | null;
  values: SimulatorValues | null;
  issues: FieldIssue[];
  mode: ValueMode;
  onModeChange: (mode: ValueMode) => void;
};

type CardContent = { label: string; value: string; notes: string[] };

const MODE_DESCRIPTIONS: Record<ValueMode, string> = {
  real: "物価上昇分を割り引いて、今のお金の価値に換算した金額です。",
  nominal: "将来のその時点で必要になる、額面どおりの金額です。",
};

export default function Results({
  scenarios,
  values,
  issues,
  mode,
  onModeChange,
}: ResultsProps) {
  const base = scenarios?.find((s) => s.id === "base");
  const cards =
    values && base ? buildCards(values, base.projection, mode) : emptyCards();

  return (
    <Paper
      component="section"
      aria-labelledby="simulator-results-title"
      sx={{ p: { xs: 2.5, sm: 3.5 }, border: 1, borderColor: "divider" }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          justifyContent: "space-between",
          alignItems: { sm: "flex-start" },
        }}
      >
        <Typography variant="h3" component="h3" id="simulator-results-title">
          試算結果
        </Typography>
        <Box>
          <Typography
            id="value-mode-label"
            variant="body2"
            sx={{ mb: 0.75, color: "text.secondary", fontSize: 13 }}
          >
            金額の表示
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            color="primary"
            value={mode}
            onChange={(_, next: ValueMode | null) => next && onModeChange(next)}
            aria-labelledby="value-mode-label"
          >
            <ToggleButton value="real">現在の購買力</ToggleButton>
            <ToggleButton value="nominal">名目（将来の円）</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Stack>
      <Typography variant="body2" sx={{ mt: 1.5, color: "text.secondary" }}>
        {MODE_DESCRIPTIONS[mode]}
      </Typography>

      {issues.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            入力内容を確認してください。修正すると結果を表示します。
          </Typography>
          <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
            {issues.map((issue) => (
              <li key={`${issue.field}-${issue.message}`}>
                {FIELD_LABELS[issue.field]}：{issue.message}
              </li>
            ))}
          </Box>
        </Alert>
      )}

      <Box
        sx={{
          mt: 2.5,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
        }}
      >
        {cards.map((card, index) => (
          <ResultCard
            key={card.label}
            wide={index === cards.length - 1}
            {...card}
          />
        ))}
      </Box>

      <Typography
        variant="body2"
        sx={{ mt: 2.5, color: "text.secondary", fontSize: 13 }}
      >
        {DISCLAIMER}
      </Typography>
    </Paper>
  );
}

function ResultCard({
  label,
  value,
  notes,
  wide,
}: CardContent & { wide: boolean }): ReactNode {
  return (
    <Box
      sx={{
        gridColumn: wide ? { sm: "1 / -1" } : undefined,
        p: 2.25,
        borderRadius: "12px",
        bgcolor: "background.default",
        border: 1,
        borderColor: "divider",
      }}
    >
      <Typography
        component="h4"
        variant="body2"
        sx={{ color: "text.secondary", fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 0.5,
          fontSize: { xs: 24, sm: 26 },
          fontWeight: 700,
          lineHeight: 1.4,
        }}
      >
        {value}
      </Typography>
      {notes.map((note) => (
        <Typography
          key={note}
          variant="body2"
          sx={{ mt: 0.75, color: "text.secondary", fontSize: 13 }}
        >
          {note}
        </Typography>
      ))}
    </Box>
  );
}

function emptyCards(): CardContent[] {
  const reason = "入力内容を修正すると表示します。";
  return [
    RESULTS_COPY.required,
    RESULTS_COPY.targetBalance,
    RESULTS_COPY.gap,
    RESULTS_COPY.earliest,
    RESULTS_COPY.depletion,
  ].map((label) => ({ label, value: "—", notes: [reason] }));
}

function buildCards(
  values: SimulatorValues,
  projection: Projection,
  mode: ValueMode,
): CardContent[] {
  const summary = summaryAtRetirement(projection, mode);
  const { currentAge, targetRetirementAge, projectionEndAge } = values;
  const T = projection.retirementMonth;
  const noRequirement = projection.requiredAtRetirement === 0;

  const requiredNotes: string[] = noRequirement
    ? ["入力したFIRE後の収入で生活費をまかなえる設定のため、目安は0円です。"]
    : [
        `取り崩し率${values.withdrawalRatePct}%で計算した${targetRetirementAge}歳時点の目安です。`,
      ];
  if (projection.incomeEnd) {
    const { month, requiredToday } = projection.incomeEnd;
    const factor = projection.points[month].inflationFactor;
    const after = toDisplayValue(requiredToday * factor, factor, mode);
    requiredNotes.push(
      `収入が終わる${formatAgeAt(currentAge, month)}以降の目安は${formatYen(after)}に上がります。`,
    );
  } else if (
    values.monthlyPostFireIncomeMan > 0 &&
    values.postFireIncomeStartAge > targetRetirementAge
  ) {
    requiredNotes.push(
      `${values.postFireIncomeStartAge}歳から始まる収入は、この目安には含めていません。`,
    );
  }

  const balanceNotes = [
    `${targetRetirementAge}歳時点で、毎月の積立を続けた場合の予想です。`,
  ];
  if (projection.progress !== null) {
    balanceNotes.push(
      `必要資産の目安に対して${formatPercentRatio(projection.progress)}です。`,
    );
  }

  const gapCard: CardContent = noRequirement
    ? {
        label: RESULTS_COPY.gap,
        value: "—",
        notes: ["必要資産の目安が0円のため、不足額は計算していません。"],
      }
    : summary.gap > 0
      ? {
          label: RESULTS_COPY.gap,
          value: formatYen(summary.gap),
          notes: ["目標リタイア時点で、必要資産の目安に届かない金額です。"],
        }
      : {
          label: RESULTS_COPY.gap,
          value: "不足なし",
          notes: [`目安を${formatYen(summary.surplus)}上回る見込みです。`],
        };

  const { earliestFire } = projection;
  const earliestValue =
    earliestFire.status === "already"
      ? "現在すでに満たしています"
      : earliestFire.status === "reached"
        ? formatAgeAt(currentAge, earliestFire.month)
        : RESULTS_COPY.notReached;
  const earliestNotes = [
    "リタイアせずに積立を続けた場合に、資産が必要資産の目安に届く時期です。退職後に資産が続くことは保証しません。",
  ];
  if (earliestFire.status === "reached") {
    earliestNotes.unshift(
      `今から${formatDuration(earliestFire.month)}後です。`,
    );
  }

  const depletionCard: CardContent =
    projection.depletionMonth === null
      ? {
          label: RESULTS_COPY.depletion,
          value: `${projectionEndAge}歳まで残ります`,
          notes: [`${RESULTS_COPY.notDepleted}。`],
        }
      : {
          label: RESULTS_COPY.depletion,
          value: formatAgeAt(currentAge, projection.depletionMonth),
          notes: [
            projection.depletionMonth === T
              ? "目標リタイアの月です。"
              : `目標リタイアから${formatDuration(projection.depletionMonth - T)}後です。`,
            ...(projection.firstShortfallMonth !== null
              ? ["その後は資産から生活費をまかなえません。"]
              : []),
          ],
        };

  return [
    {
      label: RESULTS_COPY.required,
      value: formatYen(summary.required),
      notes: requiredNotes,
    },
    {
      label: RESULTS_COPY.targetBalance,
      value: formatYen(summary.balance),
      notes: balanceNotes,
    },
    gapCard,
    {
      label: RESULTS_COPY.earliest,
      value: earliestValue,
      notes: earliestNotes,
    },
    depletionCard,
  ];
}
