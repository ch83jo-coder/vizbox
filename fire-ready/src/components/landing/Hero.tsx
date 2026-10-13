import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { FIRE_ASSETS } from "@/lib/assets";

const phrase = { display: "inline-block" } as const;

export default function Hero() {
  const hero = FIRE_ASSETS.hero;
  return (
    <Box
      component="section"
      aria-labelledby="hero-title"
      sx={{ pt: { xs: 5, md: 9 }, pb: { xs: 6, md: 10 } }}
    >
      <Container maxWidth="lg">
        <Grid
          container
          spacing={{ xs: 4, md: 6 }}
          sx={{ alignItems: "center" }}
        >
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography
              component="p"
              sx={{
                color: "secondary.main",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.18em",
              }}
            >
              FIRE SIMULATOR
            </Typography>
            <Typography variant="h1" id="hero-title" sx={{ mt: 1.5 }}>
              <Box component="span" sx={phrase}>
                資産だけでなく、
              </Box>
              <Box component="span" sx={phrase}>
                自由に生きる準備を。
              </Box>
            </Typography>
            <Typography
              sx={{
                mt: 2.5,
                color: "text.secondary",
                fontSize: { xs: 16, md: 18 },
              }}
            >
              <Box component="span" sx={phrase}>
                いくら必要か、いつ目指せるか。
              </Box>
              <Box component="span" sx={phrase}>
                あなたの条件でFIREをシミュレーション。
              </Box>
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ mt: 4 }}
            >
              <Button
                variant="contained"
                size="large"
                href="#simulator"
                sx={{ whiteSpace: "nowrap" }}
              >
                無料でシミュレーション
              </Button>
              <Button
                variant="text"
                size="large"
                href="/methodology"
                sx={{ whiteSpace: "nowrap" }}
              >
                計算の前提を見る
              </Button>
            </Stack>
            <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
              会員登録は不要です。入力内容はサーバーに送信されません。
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Image
              src={hero.src}
              width={hero.width}
              height={hero.height}
              alt=""
              preload
              sizes="(max-width: 899px) calc(100vw - 32px), 580px"
              style={{
                width: "100%",
                height: "auto",
                objectFit: "contain",
                borderRadius: 24,
              }}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
