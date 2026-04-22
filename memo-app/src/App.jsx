import { useState, useEffect, useRef } from 'react';
import Editor from './components/Editor';
import Toolbar from './components/Toolbar';
import UpdateToast from './components/UpdateToast';
import { getDateStamp } from './utils/datetime';

const STORAGE_KEY = 'memo-app-content';

function getInitialContent() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) {
    return saved;
  }
  return getDateStamp() + '\n';
}

export default function App() {
  const [content, setContent] = useState(getInitialContent);
  const [showUpdate, setShowUpdate] = useState(false);
  const newWorkerRef = useRef(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorkerRef.current = newWorker;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 새 SW 설치 완료 → 토스트 표시
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
    const newContent = getDateStamp() + '\n';
    localStorage.setItem(STORAGE_KEY, newContent);
    setContent(newContent);
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="flex-1 overflow-hidden">
        <Editor content={content} onChange={handleChange} />
      </div>
      <Toolbar onCopyAndNew={handleCopyAndNew} />
      {showUpdate && <UpdateToast onUpdate={handleUpdate} />}
    </div>
  );
}
