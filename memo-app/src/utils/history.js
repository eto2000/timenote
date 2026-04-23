const HISTORY_KEY = 'memo-app-history';
const MAX_AGE_DAYS = 7;

/**
 * 새 문서 ID 생성 (생성 시각 기반)
 */
export function createDocId() {
  return new Date().toISOString();
}

/**
 * 특정 ID의 히스토리 항목을 생성/업데이트
 * - 새 문서 생성 시: createDocId()로 ID를 만들고 최초 저장
 * - 타이핑 시: 같은 ID로 계속 덮어씀
 */
export function upsertHistory(docId, content) {
  if (!docId || !content || content.trim().length === 0) return;

  const history = getHistory();
  const dateKey = docId.split('T')[0]; // yyyy-mm-dd

  history[docId] = {
    content,
    date: dateKey,
    timestamp: docId, // 생성 시각 고정 (정렬 기준)
    updatedAt: new Date().toISOString(),
  };

  cleanOldHistory(history);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/**
 * 전체 히스토리 객체 반환
 */
export function getHistory() {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * 히스토리 목록 (최신순, 미리보기 포함)
 */
export function getHistoryList() {
  const history = getHistory();
  const list = Object.values(history).map((item) => ({
    ...item,
    preview: item.content.split('\n').slice(0, 2).join(' ').slice(0, 60),
  }));
  list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return list;
}

/**
 * 7일 지난 항목 삭제
 */
function cleanOldHistory(history) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
  Object.keys(history).forEach((key) => {
    if (new Date(history[key].timestamp) < cutoff) {
      delete history[key];
    }
  });
}
