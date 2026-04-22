const HISTORY_KEY = 'memo-app-history';
const MAX_AGE_DAYS = 7;

/**
 * 히스토리 항목 저장
 * @param {string} content - 메모 내용
 */
export function saveToHistory(content) {
  if (!content || content.trim().length === 0) return;

  const now = new Date();
  const timestamp = now.toISOString();
  const dateKey = now.toISOString().split('T')[0]; // yyyy-mm-dd

  const history = getHistory();
  
  // 같은 날짜에 여러 개 저장 가능하도록 timestamp를 키로 사용
  history[timestamp] = {
    content,
    date: dateKey,
    timestamp,
  };

  // 7일 지난 항목 삭제
  cleanOldHistory(history);

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/**
 * 전체 히스토리 가져오기 (최신순 정렬)
 * @returns {Array} [{timestamp, date, content, preview}, ...]
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
 * @returns {Array}
 */
export function getHistoryList() {
  const history = getHistory();
  const list = Object.values(history).map((item) => ({
    ...item,
    preview: item.content.split('\n').slice(0, 2).join(' ').slice(0, 60),
  }));

  // 최신순 정렬
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
    const itemDate = new Date(history[key].timestamp);
    if (itemDate < cutoff) {
      delete history[key];
    }
  });
}
