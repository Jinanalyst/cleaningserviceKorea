"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { partnerById, serviceById, type ReservationStatus } from "@/lib/data";

type LoadedReservation = {
  id: string;
  partnerId: string;
  serviceId: string;
  date: string;
  status: ReservationStatus;
};

type ExistingReview = {
  rating: number;
  body: string;
  authorName: string;
  createdAt: string;
  photos?: string[];
} | null;

const MAX_PHOTOS = 4;

// 업로드 전 브라우저에서 이미지를 축소·압축해 base64(JPEG) data URL로 변환한다.
// 긴 변을 maxSide 이하로 줄여 업로드 용량을 낮춘다.
async function compressImage(file: File, maxSide = 1600, quality = 0.8): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("파일을 읽을 수 없어요."));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("이미지를 불러올 수 없어요."));
    el.src = dataUrl;
  });

  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label="별점">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (hover || value) >= n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n}점`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className={`text-4xl transition ${active ? "text-amber-500" : "text-line"} hover:scale-110`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export default function ReviewPage() {
  const params = useParams<{ id: string }>();
  const reservationId = params.id;

  const [state, setState] = useState<
    "loading" | "unauth" | "notfound" | "notcompleted" | "form" | "done"
  >("loading");
  const [reservation, setReservation] = useState<LoadedReservation | null>(null);
  const [existing, setExisting] = useState<ExistingReview>(null);

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setError(`사진은 최대 ${MAX_PHOTOS}장까지 첨부할 수 있어요.`);
      return;
    }
    const picked = Array.from(files).slice(0, room);
    setPhotoBusy(true);
    try {
      const encoded = await Promise.all(picked.map((f) => compressImage(f)));
      setPhotos((prev) => [...prev, ...encoded]);
    } catch {
      setError("사진을 처리하지 못했어요. 다른 이미지를 시도해 주세요.");
    } finally {
      setPhotoBusy(false);
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setState("unauth");
        return;
      }
      try {
        const res = await fetch(`/api/reviews?reservation=${encodeURIComponent(reservationId)}`, {
          cache: "no-store",
        });
        if (res.status === 401) return setState("unauth");
        if (res.status === 404) return setState("notfound");
        const data = await res.json();
        setReservation(data.reservation);
        if (data.review) {
          setExisting(data.review);
          setState("done");
        } else if (data.reservation.status !== "completed") {
          setState("notcompleted");
        } else {
          setState("form");
        }
      } catch {
        setState("notfound");
      }
    })();
  }, [reservationId]);

  async function submit() {
    setError(null);
    if (rating < 1) return setError("별점을 선택해 주세요.");
    if (body.trim().length < 5) return setError("후기를 5자 이상 작성해 주세요.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, rating, body: body.trim(), photos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "후기 등록에 실패했어요.");
      setExisting({
        rating,
        body: body.trim(),
        authorName: data.review.authorName,
        createdAt: data.review.createdAt,
        photos: data.review.photos,
      });
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "후기 등록에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  const partner = reservation ? partnerById(reservation.partnerId) : null;
  const svc = reservation ? serviceById(reservation.serviceId) : null;

  return (
    <div className="mx-auto max-w-lg px-5 py-12">
      <nav className="mb-6 text-sm text-ink-soft">
        <Link href="/reservations" className="hover:text-brand">
          내 예약
        </Link>{" "}
        <span className="text-ink-soft/50">/</span> <span className="text-ink">후기 작성</span>
      </nav>

      {state === "loading" && (
        <p className="mt-10 text-center text-ink-soft">불러오는 중…</p>
      )}

      {state === "unauth" && (
        <Card emoji="🔒" title="로그인이 필요해요">
          <p className="text-sm leading-relaxed text-ink-soft">
            본인 예약에 대한 후기만 작성할 수 있어요. 로그인 후 다시 시도해 주세요.
          </p>
          <Link
            href={`/login?next=/reservations/${reservationId}/review`}
            className="mt-5 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white"
          >
            로그인하기
          </Link>
        </Card>
      )}

      {state === "notfound" && (
        <Card emoji="🔍" title="예약을 찾을 수 없어요">
          <p className="text-sm leading-relaxed text-ink-soft">
            예약 정보를 확인할 수 없어요. 내 예약에서 다시 확인해 주세요.
          </p>
          <Link
            href="/reservations"
            className="mt-5 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white"
          >
            내 예약 보기
          </Link>
        </Card>
      )}

      {state === "notcompleted" && (
        <Card emoji="🧹" title="아직 청소가 완료되지 않았어요">
          <p className="text-sm leading-relaxed text-ink-soft">
            후기는 청소가 <b>완료된 뒤</b> 남길 수 있어요. 청소가 끝나면 다시 찾아와 주세요!
          </p>
          <Link
            href="/reservations"
            className="mt-5 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white"
          >
            내 예약 보기
          </Link>
        </Card>
      )}

      {(state === "form" || state === "done") && (
        <>
          <h1 className="text-3xl font-black tracking-tight text-ink">
            {state === "done" ? "후기 감사합니다!" : "청소는 어떠셨나요?"}
          </h1>
          <p className="mt-1 text-ink-soft">
            {partner?.name ?? "담당 업체"}
            {svc ? ` · ${svc.emoji} ${svc.name}` : ""}
          </p>

          {/* 완료된 후기 보기 */}
          {state === "done" && existing && (
            <div className="mt-8 rounded-3xl border border-line bg-white p-6 shadow-sm">
              <div className="text-2xl text-amber-500">
                {"★".repeat(existing.rating)}
                <span className="text-line">{"★".repeat(5 - existing.rating)}</span>
              </div>
              <p className="mt-3 leading-relaxed text-ink">{existing.body}</p>
              {existing.photos && existing.photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {existing.photos.map((src, i) => (
                    <a
                      key={src}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-20 w-20 overflow-hidden rounded-xl ring-1 ring-line transition hover:opacity-90"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`후기 사진 ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                    </a>
                  ))}
                </div>
              )}
              <p className="mt-4 text-xs text-ink-soft">
                {existing.authorName} 님의 후기 · 소중한 의견 감사합니다 💚
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                {partner && (
                  <Link
                    href={`/partners/${partner.id}`}
                    className="flex-1 rounded-full bg-brand px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-brand-600"
                  >
                    {partner.name} 후기 보기
                  </Link>
                )}
                <Link
                  href="/reservations"
                  className="flex-1 rounded-full bg-white px-6 py-3 text-center text-sm font-bold text-ink ring-1 ring-line transition hover:bg-cream-deep"
                >
                  내 예약으로
                </Link>
              </div>
            </div>
          )}

          {/* 작성 폼 */}
          {state === "form" && (
            <div className="mt-8 space-y-6 rounded-3xl border border-line bg-white p-6 shadow-sm">
              <div>
                <label className="mb-2 block text-sm font-bold text-ink">
                  별점을 선택해 주세요
                </label>
                <StarPicker value={rating} onChange={setRating} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-ink">
                  어떤 점이 좋았나요?
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  maxLength={1000}
                  placeholder="청소 결과, 친절도, 시간 약속 등 다른 고객에게 도움이 될 후기를 남겨주세요."
                  className="w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-100"
                />
                <p className="mt-1 text-right text-xs text-ink-soft">{body.length}/1000</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-ink">
                  사진 첨부 <span className="font-medium text-ink-soft">(선택 · 최대 {MAX_PHOTOS}장)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {photos.map((src, i) => (
                    <div
                      key={i}
                      className="group relative h-20 w-20 overflow-hidden rounded-xl ring-1 ring-line"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`첨부 사진 ${i + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        aria-label={`사진 ${i + 1} 삭제`}
                        className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink/70 text-xs font-bold text-white transition hover:bg-ink"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {photos.length < MAX_PHOTOS && (
                    <label
                      className={`grid h-20 w-20 cursor-pointer place-items-center rounded-xl border border-dashed border-line text-center text-xs font-medium text-ink-soft transition hover:border-brand hover:text-brand ${
                        photoBusy ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          addPhotos(e.target.files);
                          e.target.value = "";
                        }}
                      />
                      {photoBusy ? "처리 중…" : "＋ 사진"}
                    </label>
                  )}
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                  {error}
                </p>
              )}

              <p className="rounded-xl bg-cream px-4 py-3 text-xs leading-relaxed text-ink-soft">
                ⓘ 후기에는 개인정보 보호를 위해 이름이 일부 가려진 상태(예: 홍*동)로
                표시됩니다.
              </p>

              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="w-full rounded-full bg-brand py-4 text-base font-black text-white shadow-lg shadow-brand/20 transition hover:bg-brand-600 disabled:opacity-60"
              >
                {submitting ? "등록 중…" : "후기 등록하기"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Card({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-10 rounded-2xl border border-line bg-white p-8 text-center">
      <p className="text-4xl">{emoji}</p>
      <p className="mt-3 font-bold text-ink">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
