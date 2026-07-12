import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/data";

// 공개 페이지 목록 — 대표 도메인(SITE_URL, 기본 handway.net) 기준 절대 URL 로 노출.
const PUBLIC_PATHS = [
  "/",
  "/book",
  "/consult",
  "/reservations",
  "/partners/apply",
  "/app",
  "/service-info",
  "/payment-info",
  "/refund-policy",
  "/terms",
  "/privacy",
  "/account-deletion",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
