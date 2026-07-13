// 추천 링크(?ref=코드) 유입 캡처 — 클라이언트 전용.
//   랜딩 시 URL 의 ref 를 쿠키+localStorage 에 저장하고, 예약·파트너신청 시 함께 전송한다.
const KEY = "songil_ref";
const MAX_AGE = 60 * 60 * 24 * 90; // 90일

export function captureRefFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const ref = (url.searchParams.get("ref") || "").trim().toUpperCase();
    if (ref && /^[A-Z0-9]{4,16}$/.test(ref)) {
      document.cookie = `${KEY}=${encodeURIComponent(ref)}; path=/; max-age=${MAX_AGE}; samesite=lax`;
      try {
        localStorage.setItem(KEY, ref);
      } catch {
        /* noop */
      }
    }
  } catch {
    /* noop */
  }
}

export function getStoredRef(): string {
  if (typeof window === "undefined") return "";
  try {
    const ls = localStorage.getItem(KEY);
    if (ls) return ls;
  } catch {
    /* noop */
  }
  try {
    const m = document.cookie.match(/(?:^|;\s*)songil_ref=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  } catch {
    return "";
  }
}
