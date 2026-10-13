"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { RESULTS_COPY } from "@/lib/copy";
import { summaryAtRetirement, type ValueMode } from "@/lib/fire/display";
import type { Scenario } from "@/lib/fire/scenarios";
import { formatAgeAt, formatRate, formatYen } from "@/lib/format";
import { LineSample } from "./AssetChart";

type ScenarioComparisonProps = {
  scenarios: Scenario[];
  currentAge: number;
  endAge: number;
  mode: ValueMode;
};

const ORDER = ["conservative", "base", "optimistic"] as const;

export default function ScenarioComparison({
  scenarios,
  currentAge,
  endAge,
  mode,
}: ScenarioComparisonProps) {
  return (
    <Paper
      component="section"
      aria-labelledby="scenario-title"
      sx={{ p: { xs: 2.5, sm: 3.5 }, border: 1, borderColor: "divider" }}
    >
      <Typography variant="h3" component="h3" id="scenario-title">
        利回りの仮定を変えた比較
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
        利回りだけを±2%ポイント変え、ほかの条件は同じにした比較です。起こる確率や、最悪・最善の結果を示すものではありません。
      </Typography>
      <Box
        sx={{
          mt: 2.5,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        {ORDER.map((id) => {
          const scenario = scenarios.find((s) => s.id === id);
          if (!scenario) return null;
          const { projection } = scenario;
          const summary = summaryAtRetirement(projection, mode);
          const earliest =
            projection.earliestFire.status === "already"
              ? "現在すでに満たしています"
              : projection.earliestFire.status === "reached"
                ? formatAgeAt(currentAge, projection.earliestFire.month)
                : RESULTS_COPY.notReached;
          const items: [string, string][] = [
            ["想定利回り", `年${formatRate(scenario.annualReturn)}`],
            [RESULTS_COPY.targetBalance, formatYen(summary.balance)],
            [
              RESULTS_COPY.gap,
              projection.requiredAtRetirement === 0
                ? "—"
                : summary.gap > 0
                  ? formatYen(summary.gap)
                  : "不足なし",
            ],
            [RESULTS_COPY.earliest, earliest],
            [
              RESULTS_COPY.depletion,
              projection.depletionMonth === null
                ? `${endAge}歳まで残ります`
                : formatAgeAt(currentAge, projection.depletionMonth),
            ],
          ];
          return (
            <Box
              key={id}
              sx={{
                p: 2.25,
                borderRadius: "12px",
                border: 1,
                borderColor: id === "base" ? "primary.main" : "divider",
                bgcolor: "background.default",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LineSample series={id} />
                <Typography component="h4" variant="h4">
                  {scenario.label}
                </Typography>
              </Box>
              {scenario.adjusted && (
                <Typography
                  variant="body2"
                  sx={{ mt: 0.5, fontSize: 13, color: "text.secondary" }}
                >
                  入力できる範囲に合わせて利回りを調整しています。
                </Typography>
              )}
              <Box component="dl" sx={{ m: 0, mt: 1.5 }}>
                {items.map(([term, detail]) => (
                  <Box
                    key={term}
                    sx={{ py: 0.75, borderTop: 1, borderColor: "divider" }}
                  >
                    <Typography
                      component="dt"
                      variant="body2"
                      sx={{ fontSize: 13, color: "text.secondary" }}
                    >
                      {term}
                    </Typography>
                    <Typography component="dd" sx={{ m: 0, fontWeight: 700 }}>
                      {detail}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
