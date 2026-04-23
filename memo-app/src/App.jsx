import { useState, useEffect, useRef } from 'react';
import Editor from './components/Editor';
import Toolbar from './components/Toolbar';
import HistoryPanel from './components/HistoryPanel';
import UpdateToast from './components/UpdateToast';
import { getDateStamp } from './utils/datetime';
import { saveToHistory, getHistoryList } from './utils/history';

const STORAGE_KEY = 'memo-app-content';

function getInitialContent() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) return saved;
  return getDateStamp() + '\n';
}

export default function App() {
  const [content, setContent] = useState(getInitialContent);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [showUpdate, setShowUpdate] = useState(false);
  const newWorkerRef = useRef(null);

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

  const handleChange = (value) => {
    setContent(value);
    localStorage.setItem(STORAGE_KEY, value);
  };

  const handleCopyAndNew = async () => {
    await navigator.clipboard.writeText(content);

    // 현재 내용을 히스토리에 저장
    saveToHistory(content);

    const newContent = getDateStamp() + '\n';
    localStorage.setItem(STORAGE_KEY, newContent);
    setContent(newContent);
  };

  const handleToggleHistory = () => {
    if (!showHistory) {
      setHistoryItems(getHistoryList());
    }
    setShowHistory((v) => !v);
  };

  const handleLoadHistory = (historyContent) => {
    setContent(historyContent);
    localStorage.setItem(STORAGE_KEY, historyContent);
    setShowHistory(false);
  };

  return (
    <div className="relative h-screen flex flex-col bg-white" style={{ height: '100dvh' }}>
      <div className="flex-1 overflow-hidden">
        <Editor content={content} onChange={handleChange} />
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
