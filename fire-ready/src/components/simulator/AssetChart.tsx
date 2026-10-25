"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  type TooltipValueType,
  XAxis,
  YAxis,
} from "recharts";
import { type ChartRow, toChartRows, type ValueMode } from "@/lib/fire/display";
import type { Scenario } from "@/lib/fire/scenarios";
import { formatYen, formatYenAxis } from "@/lib/format";
import { tokens } from "@/lib/tokens";

type SeriesKey = "required" | "conservative" | "base" | "optimistic";

/** 色だけに頼らず、線の種類とラベルでも区別する */
export const SERIES_STYLES: Record<
  SeriesKey,
  { label: string; color: string; dash?: string; width: number }
> = {
  base: { label: "基準", color: tokens.primary, width: 3 },
  conservative: {
    label: "利回り低め",
    color: tokens.text,
    dash: "9 6",
    width: 2,
  },
  optimistic: { label: "利回り高め", color: "#2B6A8A", dash: "1 6", width: 3 },
  required: {
    label: "必要資産の目安",
    color: tokens.accentStrong,
    dash: "14 5 3 5",
    width: 2,
  },
};

const SERIES_ORDER: SeriesKey[] = [
  "base",
  "conservative",
  "optimistic",
  "required",
];

type AssetChartProps = {
  scenarios: Scenario[];
  currentAge: number;
  targetAge: number;
  endAge: number;
  mode: ValueMode;
};

export function LineSample({ series }: { series: SeriesKey }) {
  const style = SERIES_STYLES[series];
  return (
    <svg width="40" height="12" aria-hidden="true" focusable="false">
      <line
        x1="2"
        y1="6"
        x2="38"
        y2="6"
        stroke={style.color}
        strokeWidth={style.width}
        strokeDasharray={style.dash}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AssetChart({
  scenarios,
  currentAge,
  targetAge,
  endAge,
  mode,
}: AssetChartProps) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("sm"));
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [view, setView] = useState<"chart" | "table">("chart");
  const rows = useMemo(
    () => toChartRows(scenarios, currentAge, mode),
    [scenarios, currentAge, mode],
  );

  const step = compact ? 10 : 5;
  const ticks: number[] = [];
  for (
    let age = Math.ceil(currentAge / step) * step;
    age <= endAge;
    age += step
  )
    ticks.push(age);

  const modeLabel = mode === "real" ? "現在の購買力" : "名目（将来の円）";

  return (
    <Paper
      component="section"
      aria-labelledby="asset-chart-title"
      sx={{ p: { xs: 2.5, sm: 3.5 }, border: 1, borderColor: "divider" }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
      >
        <Box>
          <Typography variant="h3" component="h3" id="asset-chart-title">
            資産の推移
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
            {currentAge}歳から{endAge}歳まで。金額は{modeLabel}
            で表示しています。
          </Typography>
        </Box>
        <ToggleButtonGroup
          exclusive
          size="small"
          color="primary"
          value={view}
          onChange={(_, next: "chart" | "table" | null) =>
            next && setView(next)
          }
          aria-label="表示形式"
        >
          <ToggleButton value="chart">グラフ</ToggleButton>
          <ToggleButton value="table">表</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Box
        component="ul"
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: { xs: 1.5, sm: 3 },
          m: 0,
          mt: 2.5,
          p: 0,
          listStyle: "none",
        }}
      >
        {SERIES_ORDER.map((key) => (
          <Box
            component="li"
            key={key}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <LineSample series={key} />
            <Typography variant="body2" component="span">
              {SERIES_STYLES[key].label}
            </Typography>
          </Box>
        ))}
      </Box>

      {view === "chart" ? (
        <Box
          component="figure"
          sx={{ m: 0, mt: 2, height: { xs: 280, sm: 360 } }}
          aria-label={`資産の推移のグラフ。${targetAge}歳に目標リタイアの線があります。数値は「表」でも確認できます。`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rows}
              margin={{ top: 12, right: 12, bottom: 4, left: 0 }}
            >
              <CartesianGrid stroke={tokens.border} vertical={false} />
              <XAxis
                dataKey="age"
                type="number"
                domain={[currentAge, endAge]}
                ticks={ticks}
                tickFormatter={(age: number) => `${age}歳`}
                tick={{ fill: tokens.muted, fontSize: 12 }}
                stroke={tokens.border}
              />
              <YAxis
                tickFormatter={formatYenAxis}
                tick={{ fill: tokens.muted, fontSize: 12 }}
                width={compact ? 52 : 64}
                tickCount={compact ? 4 : 6}
                stroke={tokens.border}
              />
              <Tooltip content={ChartTooltip} />
              <ReferenceLine
                x={targetAge}
                stroke={tokens.muted}
                strokeDasharray="3 3"
                label={{
                  value: "目標",
                  position: "insideTopLeft",
                  fill: tokens.muted,
                  fontSize: 12,
                }}
              />
              {SERIES_ORDER.map((key) => (
                <Line
                  key={key}
                  dataKey={key}
                  name={SERIES_STYLES[key].label}
                  stroke={SERIES_STYLES[key].color}
                  strokeWidth={SERIES_STYLES[key].width}
                  strokeDasharray={SERIES_STYLES[key].dash}
                  strokeLinecap="round"
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={!reduceMotion}
                  type="linear"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      ) : (
        <AssetTable rows={rows} modeLabel={modeLabel} />
      )}
    </Paper>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: TooltipContentProps<TooltipValueType, string | number>) {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        p: 1.5,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: "8px",
        boxShadow: "0 8px 24px rgba(19,45,58,0.12)",
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {Math.floor(Number(label))}歳
      </Typography>
      {payload.map((item) => (
        <Typography
          key={String(item.dataKey)}
          variant="body2"
          sx={{ fontSize: 13 }}
        >
          {item.name}：{formatYen(Number(item.value))}
        </Typography>
      ))}
    </Box>
  );
}

function AssetTable({
  rows,
  modeLabel,
}: {
  rows: ChartRow[];
  modeLabel: string;
}) {
  return (
    <TableContainer
      tabIndex={0}
      aria-labelledby="asset-table-caption"
      sx={{
        mt: 2,
        maxHeight: 440,
        border: 1,
        borderColor: "divider",
        borderRadius: "8px",
      }}
    >
      <Table stickyHeader size="small">
        <caption id="asset-table-caption" className="visually-hidden">
          1年ごとの資産の推移（{modeLabel}）
        </caption>
        <TableHead>
          <TableRow>
            <TableCell scope="col">年齢</TableCell>
            {SERIES_ORDER.map((key) => (
              <TableCell key={key} scope="col" align="right">
                {SERIES_STYLES[key].label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.month}>
              <TableCell component="th" scope="row">
                {Math.floor(row.age)}歳
              </TableCell>
              {SERIES_ORDER.map((key) => (
                <TableCell
                  key={key}
                  align="right"
                  sx={{ whiteSpace: "nowrap" }}
                >
                  {formatYen(row[key])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
