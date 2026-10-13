import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { FIRE_ASSETS, type FireAssetId } from "@/lib/assets";

const FEATURES: { icon: FireAssetId; title: string; body: string }[] = [
  {
    icon: "icon-assets",
    title: "必要資産",
    body: "生活費・取り崩し率・FIRE後の収入から、必要な資産の目安を試算します。",
  },
  {
    icon: "icon-timeline",
    title: "FIREまでの時間",
    body: "積立を続けた場合に、目標時点の予想資産と単純な基準を満たす時期を示します。",
  },
  {
    icon: "icon-readiness",
    title: "退職後の準備",
    body: "住まいやクレジットカードなど、FIRE後の生活に向けた準備ガイドを順次公開予定です。",
  },
];

export default function FeatureCards() {
  return (
    <Box
      component="section"
      aria-labelledby="features-title"
      sx={{ pb: { xs: 8, md: 12 } }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h2"
          id="features-title"
          className="visually-hidden"
        >
          FIRE READYでできること
        </Typography>
        <Box
          component="ul"
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: { xs: 2, md: 3 },
            m: 0,
            p: 0,
            listStyle: "none",
          }}
        >
          {FEATURES.map((feature) => {
            const icon = FIRE_ASSETS[feature.icon];
            return (
              <Paper
                component="li"
                key={feature.title}
                sx={{
                  p: { xs: 2.5, md: 3.5 },
                  border: 1,
                  borderColor: "divider",
                  display: "flex",
                  flexDirection: { xs: "row", md: "column" },
                  gap: 2,
                  alignItems: { xs: "center", md: "flex-start" },
                }}
              >
                <Image
                  src={icon.src}
                  width={icon.width}
                  height={icon.height}
                  alt=""
                  sizes="88px"
                  style={{
                    width: 88,
                    height: 88,
                    objectFit: "contain",
                    flexShrink: 0,
                  }}
                />
                <Box>
                  <Typography variant="h3" component="h3">
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mt: 0.75, color: "text.secondary" }}
                  >
                    {feature.body}
                  </Typography>
                </Box>
              </Paper>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
