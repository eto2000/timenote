/**
 * AppSync 클라우드 싱크 유틸리티
 *
 * AppSyncStorage SDK를 래핑하여 memo-app에서 사용하는 형태로 제공합니다.
 * SDK는 index.html의 <script> 태그로 전역 로드됩니다.
 *
 * 동기화 대상 localStorage key:
 *   memo:memo-app-content   — 현재 메모 내용
 *   memo:memo-app-doc-id    — 현재 문서 ID
 *   memo:memo-app-history   — 히스토리 전체 (JSON)
 */

const SYNC_SERVER_URL = 'https://appsync-one.vercel.app';
const SYNC_APP_ID = '3932eb01-49f1-4c13-9f9f-087a66a5dd31';
const SYNC_PREFIX = 'memo:';

let _store = null;

/**
 * AppSyncStorage 인스턴스를 반환합니다.
 * SDK가 로드되지 않은 환경(SSR 등)에서는 null을 반환합니다.
 */
export function getStore() {
  if (_store) return _store;
  if (typeof window === 'undefined' || !window.AppSyncStorage) return null;

  _store = new window.AppSyncStorage({
    appId: SYNC_APP_ID,
    serverUrl: SYNC_SERVER_URL,
    prefix: SYNC_PREFIX,
    autoSync: true,
    debounce: 1500,
    staleThreshold: 30000,
  });

  return _store;
}

/**
 * 싱크 스토어를 초기화합니다. App 마운트 시 1회 호출하세요.
 */
export async function initSync() {
  const store = getStore();
  if (!store) return;
  await store.init();
}

/**
 * prefix가 붙은 key로 localStorage에서 값을 읽습니다.
 * 싱크 스토어가 없으면 일반 localStorage를 사용합니다.
 */
export function syncGetItem(key) {
  const store = getStore();
  if (store) return store.getItem(key);
  return localStorage.getItem(key);
}

/**
 * prefix가 붙은 key로 값을 씁니다.
 * 싱크 스토어가 없으면 일반 localStorage를 사용합니다.
 */
export function syncSetItem(key, value) {
  const store = getStore();
  if (store) {
    store.setItem(key, value);
  } else {
    localStorage.setItem(key, value);
  }
}

/**
 * prefix가 붙은 key를 삭제합니다.
 */
export function syncRemoveItem(key) {
  const store = getStore();
  if (store) {
    store.removeItem(key);
  } else {
    localStorage.removeItem(key);
  }
}

/**
 * 로그인 여부를 반환합니다.
 */
export function isLoggedIn() {
  const store = getStore();
  return store ? store.isLoggedIn() : false;
}

/**
 * 로그인한 사용자 이메일을 반환합니다.
 */
export function getSyncEmail() {
  return localStorage.getItem('_appsync_email') ?? null;
}

/**
 * 현재 싱크 버전을 반환합니다.
 */
export function getSyncVersion() {
  return localStorage.getItem('_appsync_version') ?? '0';
}
