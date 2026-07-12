import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/data";

// 검색엔진 크롤링 규칙. 운영/인증/내부 API 경로는 색인에서 제외하고,
// 사이트맵 위치는 대표 도메인(SITE_URL) 기준으로 안내한다.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/auth", "/onboarding", "/login"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
