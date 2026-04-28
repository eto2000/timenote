import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from './components/Editor';
import Toolbar from './components/Toolbar';
import HistoryPanel from './components/HistoryPanel';
import UpdateToast from './components/UpdateToast';
import SyncButton from './components/SyncButton';
import { getDateStamp } from './utils/datetime';
import { createDocId, upsertHistory, getHistoryList } from './utils/history';
import { initSync, getStore, syncGetItem, syncSetItem } from './utils/sync';

// localStorage key (AppSync prefix 없이 사용 — sync.js에서 prefix 처리)
const STORAGE_KEY = 'memo-app-content';
const DOC_ID_KEY = 'memo-app-doc-id';

function getInitialState() {
  const savedContent = syncGetItem(STORAGE_KEY);
  const savedDocId = syncGetItem(DOC_ID_KEY);

  if (savedContent !== null && savedDocId) {
    return { content: savedContent, docId: savedDocId };
  }

  // 로컬에 데이터가 없을 때: 싱크 pull 완료 후 데이터가 내려올 수 있으므로
  // 아직 저장하지 않고 임시 상태만 반환한다. (pendingNew 플래그로 표시)
  const newDocId = createDocId();
  const newContent = getDateStamp() + '\n';
  return { content: newContent, docId: newDocId, pendingNew: true };
}

export default function App() {
  const [{ content, docId, pendingNew }, setState] = useState(getInitialState);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [showUpdate, setShowUpdate] = useState(false);
  const [syncState, setSyncState] = useState('idle'); // idle | syncing | ok | error | offline
  const editorRef = useRef(null);
  const newWorkerRef = useRef(null);
  const debounceRef = useRef(null);
  const pendingNewRef = useRef(pendingNew);

  // pendingNew 상태가 바뀔 때 ref 동기화
  useEffect(() => {
    pendingNewRef.current = pendingNew;
  }, [pendingNew]);

  // AppSync 초기화 및 이벤트 등록
  useEffect(() => {
    let store = null;

    async function setup() {
      await initSync();
      store = getStore();
      if (!store) return;

      store.addEventListener('login', (e) => {
        console.log('[Sync] 로그인:', e.detail.email);
        setSyncState('ok');
        // 로그인 후 서버 데이터를 pull해서 최신 상태로 갱신
        store.pull();
      });

      store.addEventListener('logout', () => {
        console.log('[Sync] 로그아웃');
        setSyncState('idle');
      });

      store.addEventListener('synced', (e) => {
        setSyncState('ok');
        if (e.detail.direction === 'pull') {
          // pull 완료 후 서버 데이터가 있으면 UI 갱신
          // pendingNew 상태(로컬 데이터 없이 시작)라면 서버 데이터 우선 적용
          reloadFromStorage();
        }
      });

      store.addEventListener('error', (e) => {
        console.warn('[Sync] 오류:', e.detail.operation, e.detail.error);
        setSyncState('error');
      });

      store.addEventListener('online', () => {
        setSyncState('ok');
      });

      store.addEventListener('offline', () => {
        setSyncState('offline');
      });

      // 이미 로그인된 상태라면 상태 표시
      if (store.isLoggedIn()) {
        setSyncState('ok');
      }
    }

    setup();

    return () => {
      // 이벤트 리스너는 store 인스턴스가 싱글톤이므로 cleanup 불필요
    };
  }, []);

  // 서버 pull 후 localStorage에서 최신 데이터를 읽어 UI 갱신
  const reloadFromStorage = useCallback(() => {
    const latestContent = syncGetItem(STORAGE_KEY);
    const latestDocId = syncGetItem(DOC_ID_KEY);
    if (latestContent !== null && latestDocId) {
      // 서버 데이터가 있으면 그걸로 갱신 (pendingNew 해제)
      setState({ content: latestContent, docId: latestDocId, pendingNew: false });
    } else if (pendingNewRef.current) {
      // 서버에도 데이터가 없으면 이제 새 문서를 실제로 저장
      setState((prev) => {
        syncSetItem(STORAGE_KEY, prev.content);
        syncSetItem(DOC_ID_KEY, prev.docId);
        return { ...prev, pendingNew: false };
      });
    }
  }, []);

  // 서비스 워커 등록
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorkerRef.current = newWorker;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setShowUpdate(true);
          }
        });
      });
    });
  }, []);

  const handleUpdate = () => {
    if (newWorkerRef.current) {
      newWorkerRef.current.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdate(false);
    window.location.reload();
  };

  // debounce로 히스토리 업데이트 (1초 후)
  const debouncedUpsert = useCallback((id, value) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      upsertHistory(id, value);
    }, 1000);
  }, []);

  const handleChange = (value) => {
    setState((prev) => {
      if (prev.pendingNew) {
        // 처음 타이핑 시 pendingNew 해제하고 실제 저장
        syncSetItem(DOC_ID_KEY, prev.docId);
      }
      return { ...prev, content: value, pendingNew: false };
    });
    syncSetItem(STORAGE_KEY, value);
    debouncedUpsert(docId, value);
    setSyncState((prev) => (prev === 'offline' ? 'offline' : 'syncing'));
  };

  const handleCopyAndNew = async () => {
    await navigator.clipboard.writeText(content);

    // 즉시 히스토리 저장 (debounce 취소 후 바로 저장)
    clearTimeout(debounceRef.current);
    upsertHistory(docId, content);

    // 새 문서 생성
    const newDocId = createDocId();
    const newContent = getDateStamp() + '\n';
    syncSetItem(STORAGE_KEY, newContent);
    syncSetItem(DOC_ID_KEY, newDocId);
    setState({ content: newContent, docId: newDocId });
  };

  const handleToggleHistory = () => {
    if (!showHistory) {
      setHistoryItems(getHistoryList());
    }
    setShowHistory((v) => !v);
  };

  const handleLoadHistory = (historyContent) => {
    // 현재 문서 즉시 저장 후 히스토리 항목 불러오기
    clearTimeout(debounceRef.current);
    upsertHistory(docId, content);

    const newDocId = createDocId();
    syncSetItem(STORAGE_KEY, historyContent);
    syncSetItem(DOC_ID_KEY, newDocId);
    setState({ content: historyContent, docId: newDocId });
    setShowHistory(false);
  };

  return (
    <div className="relative h-screen flex flex-col bg-white" style={{ height: '100dvh' }}>
      <div className="flex-1 overflow-hidden">
        <Editor ref={editorRef} content={content} onChange={handleChange} />
      </div>
      <Toolbar onCopyAndNew={handleCopyAndNew} />

      {/* 히스토리 버튼 — 좌측 하단 고정 */}
      <button
        onClick={handleToggleHistory}
        className="fixed bottom-4 left-4 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors text-lg z-30"
        title="최근 기록"
      >
        ☰
      </button>

      {/* 싱크 버튼 — 우측 하단에서 두 번째 */}
      <div className="fixed bottom-16 right-4 z-30">
        <SyncButton syncState={syncState} />
      </div>

      {/* Enter 버튼 — 우측 하단 고정 */}
      <button
        onClick={() => editorRef.current?.insertNewline()}
        className="fixed bottom-4 right-4 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors text-sm z-30"
        title="줄바꿈"
      >
        ↵
      </button>

      {showHistory && (
        <HistoryPanel
          items={historyItems}
          onLoad={handleLoadHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
      {showUpdate && <UpdateToast onUpdate={handleUpdate} />}
    </div>
  );
}
