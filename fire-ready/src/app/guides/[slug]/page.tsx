import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import GuideChecklist from "@/components/guides/GuideChecklist";
import PageIntro, { ProseSection } from "@/components/PageIntro";
import {
  findGuide,
  GUIDES,
  isPreviewable,
  isPublished,
} from "@/content/guides";
import type { Guide } from "@/content/guides/schema";
import { FIRE_ASSETS, isFireAssetId } from "@/lib/assets";

type GuidePageProps = { params: Promise<{ slug: string }> };

const THUMBNAIL_ALT: Record<string, string> = {
  "thumbnail-rental": "扉の開いた住まいの模型と、台座に置かれた鍵のイラスト",
  "thumbnail-credit": "台座に置かれた2枚のカードと盾のイラスト",
};

/** 公開記事と、noindex のプレビューだけを生成する。未作成のテーマは 404 */
export function generateStaticParams() {
  return GUIDES.filter(
    (guide) => isPublished(guide) || isPreviewable(guide),
  ).map((guide) => ({
    slug: guide.slug,
  }));
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) return {};
  return {
    title: isPublished(guide)
      ? guide.title_ja
      : `${guide.title_ja}（プレビュー）`,
    description: guide.summary_ja,
    robots: isPublished(guide) ? undefined : { index: false, follow: false },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide || !(isPublished(guide) || isPreviewable(guide))) notFound();

  const preview = !isPublished(guide);
  const assetId = guide.thumbnail_asset_id;
  const image = assetId && isFireAssetId(assetId) ? FIRE_ASSETS[assetId] : null;

  return (
    <Container maxWidth="lg">
      <Box sx={{ pt: 3 }}>
        <Link
          href="/guides"
          sx={{ display: "inline-flex", alignItems: "center", minHeight: 44 }}
        >
          ガイド一覧に戻る
        </Link>
      </Box>
      <PageIntro title={guide.title_ja}>
        {preview && (
          <Chip
            label="プレビュー（未公開）"
            color="secondary"
            variant="outlined"
            size="small"
            sx={{ mb: 1.5 }}
          />
        )}
        <Box component="span" sx={{ display: "block" }}>
          {guide.summary_ja}
        </Box>
      </PageIntro>

      {image && assetId && (
        <Box sx={{ maxWidth: 760, borderRadius: "16px", overflow: "hidden" }}>
          <Image
            src={image.src}
            width={image.width}
            height={image.height}
            alt={THUMBNAIL_ALT[assetId] ?? ""}
            sizes="(max-width: 799px) calc(100vw - 32px), 760px"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Box>
      )}

      {preview ? <PreviewBody guide={guide} /> : <ArticleBody guide={guide} />}

      <ProseSection
        title={
          preview ? "準備チェックリスト（プレビュー）" : "準備チェックリスト"
        }
      >
        <Box sx={{ mt: 2 }}>
          <GuideChecklist
            slug={guide.slug}
            items={guide.checklist}
            offerBudget={guide.category === "rental"}
          />
        </Box>
      </ProseSection>

      {guide.limitations.length > 0 && (
        <ProseSection title="ご注意">
          <ul>
            {guide.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </ProseSection>
      )}
    </Container>
  );
}

function PreviewBody({ guide }: { guide: Guide }) {
  return (
    <>
      <Alert severity="info" sx={{ mt: 4, maxWidth: 760 }}>
        このガイドは公式情報の確認中のため、まだ公開していません。制度や審査条件の説明は、確認日と出典を添えて公開します。
      </Alert>
      <ProseSection title="公開予定の内容">
        <ol>
          {guide.outline_ja.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </ProseSection>
      {guide.sources.length > 0 && (
        <ProseSection title="確認予定の資料">
          <ul>
            {guide.sources.map((source) => (
              <li key={source.url}>
                <Link
                  href={source.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {source.title}
                </Link>
                （{source.publisher}）
              </li>
            ))}
          </ul>
          <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
            内容は公開前に確認します。
          </Typography>
        </ProseSection>
      )}
    </>
  );
}

function ArticleBody({ guide }: { guide: Guide }) {
  return (
    <>
      <Typography variant="body2" sx={{ mt: 3, color: "text.secondary" }}>
        確認日：{guide.reviewed_at}
        {guide.reviewer ? `・確認者：${guide.reviewer}` : ""}
      </Typography>
      {guide.body.map((section) => (
        <ProseSection key={section.heading} title={section.heading}>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </ProseSection>
      ))}
      <ProseSection title="出典">
        <ul>
          {guide.sources.map((source) => (
            <li key={source.url}>
              <Link href={source.url} rel="noopener noreferrer" target="_blank">
                {source.title}
              </Link>
              （{source.publisher}、{source.checked_at}確認）
            </li>
          ))}
        </ul>
      </ProseSection>
    </>
  );
}
