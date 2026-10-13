import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import GuidePreviewCards from "@/components/guides/GuidePreviewCards";
import PageIntro, { ProseSection } from "@/components/PageIntro";
import { GUIDES, isPreviewable, isPublished } from "@/content/guides";

export const metadata: Metadata = {
  title: "FIRE後の生活準備ガイド",
  description:
    "住まい・クレジットカード・社会保険など、FIRE後の生活に向けた準備ガイドを順次公開予定です。",
};

export default function GuidesPage() {
  const published = GUIDES.filter(isPublished);
  const upcoming = GUIDES.filter(
    (guide) => !isPublished(guide) && !isPreviewable(guide),
  );

  return (
    <Container maxWidth="lg">
      <PageIntro title="FIRE後の生活準備ガイド">
        資産の準備に加えて、住まい・クレジットカード・社会保険など、退職後の生活で確認しておきたいことを整理するガイドです。
      </PageIntro>

      <Alert severity="info" sx={{ maxWidth: 760 }}>
        準備ガイドは順次公開予定です。現在は公式情報の確認中のため、構成とチェックリストのプレビューのみ表示しています。
      </Alert>

      {published.length > 0 && (
        <Box
          component="section"
          aria-labelledby="published-title"
          sx={{ mt: 6 }}
        >
          <Typography variant="h2" id="published-title">
            公開中のガイド
          </Typography>
          <Box component="ul" sx={{ mt: 2, pl: 3 }}>
            {published.map((guide) => (
              <li key={guide.slug}>
                <Link href={`/guides/${guide.slug}`}>{guide.title_ja}</Link>
              </li>
            ))}
          </Box>
        </Box>
      )}

      <Box component="section" aria-labelledby="preview-title" sx={{ mt: 6 }}>
        <Typography variant="h2" id="preview-title" sx={{ mb: 3 }}>
          プレビュー
        </Typography>
        <GuidePreviewCards headingLevel="h3" />
      </Box>

      <Box component="section" aria-labelledby="upcoming-title" sx={{ mt: 6 }}>
        <Typography variant="h2" id="upcoming-title">
          今後公開予定のテーマ
        </Typography>
        <Box
          component="ul"
          sx={{ mt: 2, p: 0, listStyle: "none", display: "grid", gap: 1.5 }}
        >
          {upcoming.map((guide) => (
            <Box
              component="li"
              key={guide.slug}
              sx={{
                p: 2.5,
                border: 1,
                borderColor: "divider",
                borderRadius: "12px",
                bgcolor: "background.paper",
              }}
            >
              <Chip label="準備中" size="small" variant="outlined" />
              <Typography
                variant="h3"
                component="h3"
                sx={{ mt: 1, fontSize: "1.0625rem" }}
              >
                {guide.title_ja}
              </Typography>
              <Typography
                variant="body2"
                sx={{ mt: 0.5, color: "text.secondary" }}
              >
                {guide.summary_ja}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <ProseSection title="ガイドの方針">
        <ul>
          <li>
            信用情報機関の指標と、カード会社・保証会社などの個別の審査（支払い能力の確認を含む）を区別して説明します。退職したことだけで評価が決まると断定しません。
          </li>
          <li>
            審査を回避する方法や、事実と異なる職業・収入の記載は案内しません。
          </li>
          <li>
            制度・審査条件・料率などは、信用情報機関・金融機関・保証会社・日本年金機構・自治体・国税庁などの一次情報を確認してから公開し、確認日と出典を本文に記載します。
          </li>
          <li>
            チェックリストは準備のための目安で、審査の結果を予測するものではありません。
          </li>
        </ul>
      </ProseSection>
    </Container>
  );
}
