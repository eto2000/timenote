import { useState } from 'react';
import Editor from './components/Editor';
import Toolbar from './components/Toolbar';
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

  const handleChange = (value) => {
    setContent(value);
    localStorage.setItem(STORAGE_KEY, value);
  };

  const handleCopyAndNew = async () => {
    // 클립보드 복사 (실패 시 예외 throw → Toolbar에서 'Failed!' 표시)
    await navigator.clipboard.writeText(content);

    // 새 문서 생성
    const newContent = getDateStamp() + '\n';
    localStorage.setItem(STORAGE_KEY, newContent);
    setContent(newContent);
  };

  return (
    <div className="h-screen flex flex-col bg-amber-50">
      <div className="flex-1 overflow-hidden">
        <Editor content={content} onChange={handleChange} />
      </div>
      <Toolbar onCopyAndNew={handleCopyAndNew} />
    </div>
  );
}
