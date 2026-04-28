import { syncGetItem, syncSetItem } from './sync';

const HISTORY_KEY = 'memo-app-history';
const MAX_AGE_DAYS = 7;

/**
 * 새 문서 ID 생성 (UUID v4 기반 고유키)
 */
export function createDocId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // fallback: 랜덤 hex 문자열
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * 특정 ID의 히스토리 항목을 생성/업데이트
 * - 새 문서 생성 시: createDocId()로 ID를 만들고 최초 저장
 * - 타이핑 시: 같은 ID로 계속 덮어씀
 */
export function upsertHistory(docId, content) {
  if (!docId || !content || content.trim().length === 0) return;

  const history = getHistory();
  const now = new Date().toISOString();
  const dateKey = now.split('T')[0]; // yyyy-mm-dd

  const existing = history[docId];
  history[docId] = {
    content,
    date: existing?.date ?? dateKey,           // 최초 생성일 고정
    timestamp: existing?.timestamp ?? now,     // 생성 시각 고정 (정렬 기준)
    updatedAt: now,
  };

  cleanOldHistory(history);
  syncSetItem(HISTORY_KEY, JSON.stringify(history));
}

/**
 * 전체 히스토리 객체 반환
 */
export function getHistory() {
  const raw = syncGetItem(HISTORY_KEY);
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
    const ts = history[key].timestamp ?? history[key].updatedAt;
    if (!ts || new Date(ts) < cutoff) {
      delete history[key];
    }
  });
}
