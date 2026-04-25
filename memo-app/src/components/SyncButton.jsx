import { useState, useEffect } from 'react';
import { getStore, isLoggedIn, getSyncEmail, getSyncVersion } from '../utils/sync';

/**
 * 클라우드 싱크 상태 버튼
 *
 * 상태:
 *   - 로그아웃: 구름 아이콘 (회색) — 클릭 시 로그인
 *   - 동기화 중: 구름 아이콘 (노란색, 애니메이션)
 *   - 동기화 완료: 구름 아이콘 (파란색)
 *   - 오류: 구름 아이콘 (빨간색)
 *   - 오프라인: 구름 아이콘 (회색, 취소선)
 */
export default function SyncButton({ syncState }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState(null);
  const [version, setVersion] = useState('0');

  // 로그인 상태 및 버전 갱신
  useEffect(() => {
    const update = () => {
      setLoggedIn(isLoggedIn());
      setEmail(getSyncEmail());
      setVersion(getSyncVersion());
    };
    update();

    const store = getStore();
    if (!store) return;

    store.addEventListener('login', update);
    store.addEventListener('logout', update);
    store.addEventListener('synced', update);

    return () => {
      store.removeEventListener('login', update);
      store.removeEventListener('logout', update);
      store.removeEventListener('synced', update);
    };
  }, []);

  const handleClick = () => {
    const store = getStore();
    if (!store) return;

    if (loggedIn) {
      setShowTooltip((v) => !v);
    } else {
      store.login();
    }
  };

  const handleLogout = () => {
    const store = getStore();
    if (!store) return;
    store.logout();
    setShowTooltip(false);
  };

  const handleSync = async () => {
    const store = getStore();
    if (!store) return;
    setShowTooltip(false);
    await store.sync();
  };

  // 상태별 아이콘 색상
  const dotColor = {
    idle: loggedIn ? 'text-blue-400' : 'text-gray-300',
    syncing: 'text-yellow-400',
    ok: 'text-blue-400',
    error: 'text-red-400',
    offline: 'text-gray-300',
  }[syncState] ?? 'text-gray-300';

  const isSyncing = syncState === 'syncing';

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-gray-100 ${dotColor}`}
        title={loggedIn ? `동기화 중 (${email})` : '클라우드 동기화 로그인'}
      >
        {/* 구름 아이콘 */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`w-5 h-5 ${isSyncing ? 'animate-pulse' : ''}`}
        >
          {syncState === 'offline' ? (
            /* 오프라인: 구름에 X */
            <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95A5.469 5.469 0 0 1 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11A2.98 2.98 0 0 1 22 15c0 1.65-1.35 3-3 3zM8.41 16 10 14.41 11.59 16 13 14.59 11.41 13 13 11.41 11.59 10 10 11.59 8.41 10 7 11.41 8.59 13 7 14.59z" />
          ) : (
            /* 기본 구름 */
            <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
          )}
        </svg>
      </button>

      {/* 로그인 상태 툴팁 */}
      {showTooltip && loggedIn && (
        <div className="absolute bottom-12 right-0 w-56 bg-white border border-gray-200 rounded-lg shadow-xl p-3 z-50">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                syncState === 'ok' ? 'bg-blue-400' :
                syncState === 'syncing' ? 'bg-yellow-400 animate-pulse' :
                syncState === 'error' ? 'bg-red-400' :
                'bg-gray-300'
              }`}
            />
            <span className="text-xs text-gray-500 truncate">{email}</span>
          </div>
          <div className="text-xs text-gray-400 mb-3">버전 {version}</div>
          <div className="flex gap-2">
            <button
              onClick={handleSync}
              className="flex-1 text-xs py-1.5 px-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-gray-600"
            >
              지금 동기화
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 text-xs py-1.5 px-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-gray-600"
            >
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
