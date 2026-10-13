import { z } from "zod";

const isoDate = z.iso.date();

export const guideSourceSchema = z.object({
  title: z.string().min(1),
  url: z.url(),
  publisher: z.string().min(1),
  /** 公開前に一次資料を確認した日。未確認なら null */
  checked_at: isoDate.nullable(),
  claim: z.string().min(1),
});

export const guideSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title_ja: z.string().min(1),
    summary_ja: z.string().min(1),
    category: z.enum(["rental", "credit", "loan", "insurance", "documents"]),
    country: z.literal("JP"),
    region: z.string().nullable(),
    status: z.enum(["draft", "reviewed", "published"]),
    reviewed_at: isoDate.nullable(),
    review_due_at: isoDate.nullable(),
    reviewer: z.string().nullable(),
    sources: z.array(guideSourceSchema),
    limitations: z.array(z.string()),
    checklist: z.array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        label: z.string().min(1),
        optional: z.boolean(),
        official_link: z.url().nullable(),
      }),
    ),
    thumbnail_asset_id: z.string().nullable(),
    /** 公開予定の構成（プレビュー用） */
    outline_ja: z.array(z.string()),
    /** 公開記事の本文（構造化コンテンツ） */
    body: z.array(
      z.object({ heading: z.string(), paragraphs: z.array(z.string()) }),
    ),
  })
  .superRefine((guide, ctx) => {
    if (guide.status !== "published") return;
    const missing = [
      !guide.reviewed_at && "reviewed_at",
      !guide.reviewer && "reviewer",
      guide.body.length === 0 && "body",
      guide.sources.length === 0 && "sources",
      guide.sources.some((s) => !s.checked_at) && "sources.checked_at",
    ].filter(Boolean);
    if (missing.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `公開記事には確認済みの情報が必要です: ${missing.join(", ")}`,
      });
    }
  });

export type Guide = z.infer<typeof guideSchema>;
