import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from './components/Editor';
import Toolbar from './components/Toolbar';
import HistoryPanel from './components/HistoryPanel';
import UpdateToast from './components/UpdateToast';
import { getDateStamp } from './utils/datetime';
import { createDocId, upsertHistory, getHistoryList } from './utils/history';

const STORAGE_KEY = 'memo-app-content';
const DOC_ID_KEY = 'memo-app-doc-id';

function getInitialState() {
  const savedContent = localStorage.getItem(STORAGE_KEY);
  const savedDocId = localStorage.getItem(DOC_ID_KEY);

  if (savedContent !== null && savedDocId) {
    return { content: savedContent, docId: savedDocId };
  }

  // 새 문서 생성
  const newDocId = createDocId();
  const newContent = getDateStamp() + '\n';
  localStorage.setItem(STORAGE_KEY, newContent);
  localStorage.setItem(DOC_ID_KEY, newDocId);
  return { content: newContent, docId: newDocId };
}

export default function App() {
  const [{ content, docId }, setState] = useState(getInitialState);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [showUpdate, setShowUpdate] = useState(false);
  const editorRef = useRef(null);
  const newWorkerRef = useRef(null);
  const debounceRef = useRef(null);

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
    setState((prev) => ({ ...prev, content: value }));
    localStorage.setItem(STORAGE_KEY, value);
    debouncedUpsert(docId, value);
  };

  const handleCopyAndNew = async () => {
    await navigator.clipboard.writeText(content);

    // 즉시 히스토리 저장 (debounce 취소 후 바로 저장)
    clearTimeout(debounceRef.current);
    upsertHistory(docId, content);

    // 새 문서 생성
    const newDocId = createDocId();
    const newContent = getDateStamp() + '\n';
    localStorage.setItem(STORAGE_KEY, newContent);
    localStorage.setItem(DOC_ID_KEY, newDocId);
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
    localStorage.setItem(STORAGE_KEY, historyContent);
    localStorage.setItem(DOC_ID_KEY, newDocId);
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
