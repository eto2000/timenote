/**
 * 오늘 날짜를 yyyy.mm.dd (요일) 형식으로 반환
 * 예: "2026.04.22 (수)"
 */
export function getDateStamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const day = days[now.getDay()];
  return `${yyyy}.${mm}.${dd} (${day})`;
}

/**
 * 현재 시간을 hh:mm 형식으로 반환 (두 자리 패딩 포함)
 * 예: "09:05"
 */
export function getTimeStamp() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
