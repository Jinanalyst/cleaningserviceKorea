"use client";

import { useEffect } from "react";
import { captureRefFromUrl } from "@/lib/ref";

// 랜딩 시 URL 의 ?ref= 추천 코드를 저장한다. (렌더 없음)
export default function RefCapture() {
  useEffect(() => {
    captureRefFromUrl();
  }, []);
  return null;
}
