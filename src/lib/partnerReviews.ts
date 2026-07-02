// 파트너 후기 조회 — 고객이 남긴 DB 후기 + 시드 후기를 합쳐 화면 표시용으로 반환.
// service_role로 DB에 접근하므로 서버(라우트 핸들러/서버 컴포넌트)에서만 사용.
import "server-only";
import { reviewsFor, serviceById, type Review } from "./data";
import { listReviewsByPartner } from "./reviewStore";

// 고객이 작성한 최신 후기를 앞에, 시드 후기를 뒤에 배치해 반환한다.
export async function getPartnerReviews(partnerId: string): Promise<Review[]> {
  const seed = reviewsFor(partnerId);
  let submitted: Review[] = [];
  try {
    const rows = await listReviewsByPartner(partnerId);
    submitted = rows.map((r) => ({
      author: r.authorName,
      rating: r.rating,
      date: r.createdAt.slice(0, 10).replace(/-/g, "."),
      service: serviceById(r.serviceId)?.name ?? "청소 서비스",
      text: r.body,
    }));
  } catch {
    submitted = [];
  }
  return [...submitted, ...seed];
}
