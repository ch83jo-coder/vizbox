import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import GuidePreviewCards from "@/components/guides/GuidePreviewCards";
import Faq from "@/components/landing/Faq";
import FeatureCards from "@/components/landing/FeatureCards";
import Hero from "@/components/landing/Hero";
import Simulator from "@/components/simulator/Simulator";
import { tokens } from "@/lib/tokens";

function SectionHeading({
  id,
  title,
  lead,
}: {
  id: string;
  title: string;
  lead?: string;
}) {
  return (
    <Box sx={{ mb: { xs: 3, md: 4 }, maxWidth: 760 }}>
      <Typography variant="h2" id={id}>
        {title}
      </Typography>
      {lead && (
        <Typography sx={{ mt: 1.5, color: "text.secondary" }}>
          {lead}
        </Typography>
      )}
    </Box>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeatureCards />

      <Box
        component="section"
        id="simulator"
        aria-labelledby="simulator-title"
        sx={{ py: { xs: 6, md: 10 }, bgcolor: tokens.band }}
      >
        <Container maxWidth="lg">
          <SectionHeading
            id="simulator-title"
            title="FIREシミュレーター"
            lead="会員登録なしで、入力するとすぐに計算します。計算はこのブラウザーの中だけで行います。"
          />
          <Simulator />
        </Container>
      </Box>

      <Box
        component="section"
        aria-labelledby="guides-title"
        sx={{ pt: { xs: 8, md: 12 } }}
      >
        <Container maxWidth="lg">
          <SectionHeading
            id="guides-title"
            title="FIRE後の生活準備ガイド"
            lead="住まいやクレジットカードなど、退職後の生活に向けた準備ガイドを順次公開予定です。現在は内容を確認中のため、構成とチェックリストのプレビューをご覧いただけます。"
          />
          <GuidePreviewCards headingLevel="h3" />
          <Button
            variant="contained"
            size="large"
            href="/guides"
            sx={{ mt: 4 }}
          >
            FIRE後の生活準備をチェック
          </Button>
        </Container>
      </Box>

      <Box
        component="section"
        aria-labelledby="faq-title"
        sx={{ pt: { xs: 8, md: 12 } }}
      >
        <Container maxWidth="lg">
          <SectionHeading id="faq-title" title="よくある質問" />
          <Faq />
        </Container>
      </Box>

      <Box
        component="section"
        aria-labelledby="notes-title"
        sx={{ pt: { xs: 8, md: 12 } }}
      >
        <Container maxWidth="lg">
          <SectionHeading
            id="notes-title"
            title="出典・注意事項・プライバシー"
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 3,
            }}
          >
            <Box>
              <Typography variant="h3" component="h3">
                計算方法
              </Typography>
              <Typography
                variant="body2"
                sx={{ mt: 1, color: "text.secondary" }}
              >
                計算式と前提はすべて公開しています。外部のデータや統計は使わず、入力した値だけで計算します。
              </Typography>
              <Link
                href="/methodology"
                sx={{
                  display: "inline-flex",
                  minHeight: 44,
                  alignItems: "center",
                }}
              >
                計算の前提を見る
              </Link>
            </Box>
            <Box>
              <Typography variant="h3" component="h3">
                注意事項
              </Typography>
              <Typography
                variant="body2"
                sx={{ mt: 1, color: "text.secondary" }}
              >
                投資や退職の判断を勧めるものではありません。制度・審査に関する情報は、公式情報を確認したうえでガイドとして公開します。
              </Typography>
            </Box>
            <Box>
              <Typography variant="h3" component="h3">
                プライバシー
              </Typography>
              <Typography
                variant="body2"
                sx={{ mt: 1, color: "text.secondary" }}
              >
                入力内容はサーバーに送信しません。保存はこの端末を選んだときだけ行います。
              </Typography>
              <Link
                href="/privacy"
                sx={{
                  display: "inline-flex",
                  minHeight: 44,
                  alignItems: "center",
                }}
              >
                保存と共有について
              </Link>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}
