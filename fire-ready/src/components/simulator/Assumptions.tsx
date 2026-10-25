import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { MODEL_ASSUMPTIONS, MODEL_LIMITATIONS } from "@/lib/copy";
import { formatRate } from "@/lib/format";

/** 計算の前提の折りたたみ。実質利回りは参考表示で、計算には使わない */
export default function Assumptions({
  realReturn,
}: {
  realReturn: number | null;
}) {
  return (
    <Box
      component="details"
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        border: 1,
        borderColor: "divider",
        borderRadius: "16px",
        bgcolor: "background.paper",
        "& summary": {
          cursor: "pointer",
          fontWeight: 700,
          fontSize: "1.0625rem",
          minHeight: 44,
          display: "flex",
          alignItems: "center",
        },
      }}
    >
      <summary>計算の前提と、この試算に含まれないもの</summary>
      <Typography variant="h4" component="h4" sx={{ mt: 2 }}>
        計算の前提
      </Typography>
      <Box component="ul" sx={{ mt: 1, pl: 2.5 }}>
        {MODEL_ASSUMPTIONS.map((item) => (
          <li key={item}>
            <Typography variant="body2">{item}</Typography>
          </li>
        ))}
        {realReturn !== null && (
          <li>
            <Typography variant="body2">
              参考：物価上昇を差し引いた実質利回りは年{formatRate(realReturn)}
              です（(1+利回り)÷(1+物価上昇率)−1。計算には使いません）。
            </Typography>
          </li>
        )}
      </Box>
      <Typography variant="h4" component="h4" sx={{ mt: 2 }}>
        この試算に含まれないもの
      </Typography>
      <Box component="ul" sx={{ mt: 1, pl: 2.5 }}>
        {MODEL_LIMITATIONS.map((item) => (
          <li key={item}>
            <Typography variant="body2">{item}</Typography>
          </li>
        ))}
      </Box>
      <Link
        href="/methodology"
        sx={{ display: "inline-flex", alignItems: "center", minHeight: 44 }}
      >
        計算方法の詳細を見る
      </Link>
    </Box>
  );
}
