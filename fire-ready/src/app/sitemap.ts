import type { MetadataRoute } from "next";
import { GUIDES, isPublished } from "@/content/guides";
import { SITE_URL } from "@/lib/site";

/** noindex のガイドプレビューは含めない */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/guides", "/methodology", "/privacy"].map((path) => ({
    url: `${SITE_URL}${path}`,
  }));
  const guides = GUIDES.filter(isPublished).map((guide) => ({
    url: `${SITE_URL}/guides/${guide.slug}`,
    lastModified: guide.reviewed_at ?? undefined,
  }));
  return [...pages, ...guides];
}
