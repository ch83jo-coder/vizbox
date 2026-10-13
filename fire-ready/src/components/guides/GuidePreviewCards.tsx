import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { GUIDES, isPreviewable } from "@/content/guides";
import { FIRE_ASSETS, isFireAssetId } from "@/lib/assets";

/** 未公開ガイドのプレビューカード（Phase 1 では2件） */
export default function GuidePreviewCards({
  headingLevel,
}: {
  headingLevel: "h3" | "h2";
}) {
  const previews = GUIDES.filter(isPreviewable);
  return (
    <Box
      component="ul"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 3,
        m: 0,
        p: 0,
        listStyle: "none",
      }}
    >
      {previews.map((guide) => {
        const assetId = guide.thumbnail_asset_id;
        const image =
          assetId && isFireAssetId(assetId) ? FIRE_ASSETS[assetId] : null;
        return (
          <Paper
            component="li"
            key={guide.slug}
            sx={{
              overflow: "hidden",
              border: 1,
              borderColor: "divider",
              position: "relative",
            }}
          >
            {image && (
              <Box
                sx={{
                  position: "relative",
                  aspectRatio: "3 / 2",
                  bgcolor: "background.default",
                }}
              >
                <Image
                  src={image.src}
                  alt=""
                  fill
                  sizes="(max-width: 899px) calc(100vw - 32px), 560px"
                  style={{ objectFit: "cover", objectPosition: "center" }}
                />
              </Box>
            )}
            <Box sx={{ p: { xs: 2.5, md: 3 } }}>
              <Chip
                label="準備中・プレビュー"
                size="small"
                variant="outlined"
                color="secondary"
              />
              <Typography
                variant="h3"
                component={headingLevel}
                sx={{ mt: 1.5 }}
              >
                <Link
                  href={`/guides/${guide.slug}`}
                  underline="hover"
                  sx={{
                    color: "text.primary",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                    },
                  }}
                >
                  {guide.title_ja}
                </Link>
              </Typography>
              <Typography
                variant="body2"
                sx={{ mt: 1, color: "text.secondary" }}
              >
                {guide.summary_ja}
              </Typography>
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
}
