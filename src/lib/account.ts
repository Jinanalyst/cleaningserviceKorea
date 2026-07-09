// 회원 계정 삭제 — 로그인 계정과 그에 연결된 개인정보를 파기한다.
// service_role 키로 접근하므로 서버(라우트 핸들러)에서만 사용한다.
//
// 정책(개인정보처리방침·계정 삭제 안내와 일치해야 함):
//  · 예약·상담 등 결제/계약 관련 거래 기록은 「전자상거래법」에 따라 5년간
//    보관 의무가 있어 즉시 삭제 대신 개인정보를 지우고(익명화) 계정 연결만 끊는다.
//  · 후기·프로필 등 계정에 종속된 콘텐츠는 즉시 삭제한다.
//  · 마지막으로 인증 계정(auth.users) 자체를 삭제해 로그인이 불가능하게 한다.
import "server-only";
import { getSupabase } from "./supabase";

const ANON_NAME = "(탈퇴한 회원)";

export type DeleteAccountResult = {
  reservationsAnonymized: number;
  consultationsAnonymized: number;
  reviewsDeleted: number;
  applicationsUnlinked: number;
  authDeleted: boolean;
};

// 사용자의 모든 데이터를 파기하고 인증 계정을 삭제한다.
// 반환값은 처리 건수(로그·확인용).
export async function deleteUserAccount(userId: string): Promise<DeleteAccountResult> {
  const supabase = getSupabase();

  // 1) 예약 — 개인정보 제거 후 계정 연결 해제(거래 기록은 법정 기간 보관).
  const { data: resRows, error: resErr } = await supabase
    .from("reservations")
    .update({
      user_id: null,
      customer_name: ANON_NAME,
      phone: "",
      address: "",
      address_detail: "",
      notes: "",
    })
    .eq("user_id", userId)
    .select("id");
  if (resErr) throw new Error(`예약 익명화 실패: ${resErr.message}`);

  // 2) 견적 상담 — 개인정보 제거 후 계정 연결 해제.
  const { data: consultRows, error: consultErr } = await supabase
    .from("consultations")
    .update({
      user_id: null,
      customer_name: ANON_NAME,
      phone: "",
      address: "",
      address_detail: "",
      notes: "",
    })
    .eq("user_id", userId)
    .select("id");
  if (consultErr) throw new Error(`상담 익명화 실패: ${consultErr.message}`);

  // 3) 후기 — 계정 종속 콘텐츠이므로 즉시 삭제.
  const { data: reviewRows, error: reviewErr } = await supabase
    .from("reviews")
    .delete()
    .eq("user_id", userId)
    .select("id");
  if (reviewErr) throw new Error(`후기 삭제 실패: ${reviewErr.message}`);

  // 4) 파트너 등록 신청 — 사업자·정산 서류는 관계 법령에 따라 보관될 수 있어
  //    계정 연결만 해제한다(auth.users 참조 정리 목적 포함).
  const { data: appRows, error: appErr } = await supabase
    .from("partner_applications")
    .update({ user_id: null })
    .eq("user_id", userId)
    .select("id");
  if (appErr) throw new Error(`파트너 신청 연결 해제 실패: ${appErr.message}`);

  // 5) 프로필 삭제(auth.users 삭제 시 on delete cascade 로도 지워지지만 명시적으로 처리).
  const { error: profileErr } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);
  if (profileErr) throw new Error(`프로필 삭제 실패: ${profileErr.message}`);

  // 6) 인증 계정 삭제 — 이후 로그인 불가. (모든 non-cascade 참조를 위에서 정리한 뒤 수행)
  const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
  if (authErr) throw new Error(`인증 계정 삭제 실패: ${authErr.message}`);

  return {
    reservationsAnonymized: resRows?.length ?? 0,
    consultationsAnonymized: consultRows?.length ?? 0,
    reviewsDeleted: reviewRows?.length ?? 0,
    applicationsUnlinked: appRows?.length ?? 0,
    authDeleted: true,
  };
}
