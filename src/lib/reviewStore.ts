// 후기 저장소 — Supabase(Postgres) 기반. 서버(라우트 핸들러/서버 컴포넌트)에서만 사용.
// service_role 키로 접근하므로 RLS를 우회한다. 클라이언트로 노출 금지.
import "server-only";
import { getSupabase } from "./supabase";

const TABLE = "reviews";
const PHOTO_BUCKET = "review-photos";

export type StoredReview = {
  id: string;
  createdAt: string; // ISO
  reservationId: string;
  partnerId: string;
  serviceId: string;
  userId: string | null;
  authorName: string; // 마스킹된 표시 이름
  rating: number; // 1~5
  body: string;
  photos: string[]; // 첨부 사진 공개 URL
};

type Row = {
  id: string;
  created_at: string;
  reservation_id: string;
  partner_id: string;
  service_id: string | null;
  user_id: string | null;
  author_name: string;
  rating: number;
  body: string;
  photos: string[] | null;
  status: string;
};

function fromRow(r: Row): StoredReview {
  return {
    id: r.id,
    createdAt: r.created_at,
    reservationId: r.reservation_id,
    partnerId: r.partner_id,
    serviceId: r.service_id ?? "",
    userId: r.user_id ?? null,
    authorName: r.author_name,
    rating: r.rating,
    body: r.body,
    photos: Array.isArray(r.photos) ? r.photos : [],
  };
}

// data: URL(base64) 이미지를 Storage에 업로드하고 공개 URL 목록을 반환한다.
// 잘못된 형식은 건너뛴다. 실패 시 예외를 던진다.
export async function uploadReviewPhotos(
  reservationId: string,
  images: string[]
): Promise<string[]> {
  const supabase = getSupabase();
  const urls: string[] = [];

  for (let i = 0; i < images.length; i++) {
    const match = /^data:(image\/(png|jpe?g|webp));base64,(.+)$/i.exec(images[i]);
    if (!match) continue;
    const contentType = match[1];
    const ext = contentType.split("/")[1].replace("jpeg", "jpg");
    const buffer = Buffer.from(match[3], "base64");
    const path = `${reservationId}/${Date.now()}-${i}.${ext}`;

    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, buffer, { contentType, upsert: true });
    if (error) throw new Error(`사진 업로드에 실패했어요: ${error.message}`);

    const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}

// 이름 마스킹: 홍길동 → 홍*동, 김서연 → 김*연, 이수 → 이*
export function maskName(name: string): string {
  const n = (name || "").trim();
  if (n.length <= 1) return n || "고객";
  if (n.length === 2) return n[0] + "*";
  return n[0] + "*".repeat(n.length - 2) + n[n.length - 1];
}

export async function getReviewByReservation(
  reservationId: string
): Promise<StoredReview | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("reservation_id", reservationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data as Row) : null;
}

export async function listReviewsByPartner(
  partnerId: string
): Promise<StoredReview[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("partner_id", partnerId)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Row[]).map(fromRow);
}

export async function createReview(input: {
  reservationId: string;
  partnerId: string;
  serviceId: string;
  userId: string | null;
  authorName: string;
  rating: number;
  body: string;
  photos: string[];
}): Promise<StoredReview> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .insert({
      reservation_id: input.reservationId,
      partner_id: input.partnerId,
      service_id: input.serviceId,
      user_id: input.userId,
      author_name: input.authorName,
      rating: input.rating,
      body: input.body,
      photos: input.photos,
      status: "published",
    })
    .select("*")
    .single();

  // 23505 = unique_violation → 이미 후기가 존재
  if (error) {
    if (error.code === "23505") {
      throw new Error("이미 이 예약에 대한 후기를 작성했어요.");
    }
    throw new Error(error.message);
  }
  return fromRow(data as Row);
}
