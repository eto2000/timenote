import { useState } from 'react';

/**
 * 하단 고정 툴바 컴포넌트
 * - 'Copy and New' 버튼: 클립보드 복사 후 새 문서 생성
 * - 복사 성공/실패 피드백 (버튼 텍스트 1.5초 변경)
 */
export default function Toolbar({ onCopyAndNew }) {
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
    <div className="flex justify-center items-center px-12 py-4 border-t border-gray-100 bg-white">
      <button
        onClick={handleClick}
        className="px-8 py-2 bg-gray-900 text-white rounded hover:bg-gray-700 active:bg-black transition-colors text-sm tracking-wide font-normal"
      >
        {buttonText}
      </button>
    </div>
  );
}
