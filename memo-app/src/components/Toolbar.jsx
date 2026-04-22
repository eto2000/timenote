import { useState } from 'react';

/**
 * 하단 고정 툴바
 * - 'Copy and New' 버튼: 클립보드 복사 후 새 문서 생성
 * - 히스토리 버튼: 최근 기록 패널 토글
 */
export default function Toolbar({ onCopyAndNew, onToggleHistory }) {
  const [buttonText, setButtonText] = useState('Copy and New');

  const handleClick = async () => {
    try {
      await onCopyAndNew();
      setButtonText('Copied!');
    } catch {
      setButtonText('Failed!');
    } finally {
      setTimeout(() => {
        setButtonText('Copy and New');
      }, 1500);
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-gray-100 bg-white">
      <button
        onClick={onToggleHistory}
        className="px-4 py-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors text-sm"
        title="최근 기록"
      >
        ☰
      </button>
      <button
        onClick={handleClick}
        className="px-8 py-2 bg-gray-900 text-white rounded hover:bg-gray-700 active:bg-black transition-colors text-sm tracking-wide font-normal"
      >
        {buttonText}
      </button>
    </div>
  );
}
