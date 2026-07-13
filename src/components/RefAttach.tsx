"use client";

import { useEffect } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { getStoredRef } from "@/lib/ref";

// 로그인한 사용자에게 저장된 추천코드(?ref)를 계정에 귀속한다. (렌더 없음)
//   • 추천 링크로 유입돼 로그인/가입한 고객을 추천인에게 최초 1회 연결.
//   • 서버가 멱등 처리하지만, 세션당 한 번만 호출하도록 가드한다.
export default function RefAttach() {
  useEffect(() => {
    (async () => {
      try {
        const ref = getStoredRef();
        if (!ref) return;

        // 세션 동안 같은 코드로 반복 호출 방지.
        const guardKey = "songil_ref_attached";
        if (sessionStorage.getItem(guardKey) === ref) return;

        const supabase = createSupabaseBrowser();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        await fetch("/api/referral/attach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ref }),
        });
        sessionStorage.setItem(guardKey, ref);
      } catch {
        /* 실패해도 앱 흐름을 막지 않는다. */
      }
    })();
  }, []);
  return null;
}
