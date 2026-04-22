import { useRef, useEffect } from 'react';
import { getTimeStamp } from '../utils/datetime';

/**
 * 전체 화면 텍스트 에디터 컴포넌트
 * - Enter 키 입력 시 현재 시간을 새 줄 앞에 자동 삽입
 * - 페이지 로드 시 자동 포커스
 */
export default function Editor({ content, onChange }) {
  const textareaRef = useRef(null);

  // 페이지 로드 시 자동 포커스
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // 커서를 텍스트 끝으로 이동
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return;

    // 일반 Enter: 기본 줄바꿈 동작 허용
    if (!e.shiftKey) return;

    // Shift+Enter: 시간 자동 삽입
    e.preventDefault();

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const before = content.slice(0, cursorPos);
    const after = content.slice(cursorPos);

    const timeStamp = getTimeStamp();
    const insertion = '\n' + timeStamp + ' ';
    const newContent = before + insertion + after;
    const newCursorPos = cursorPos + insertion.length;

    onChange(newContent);

    // requestAnimationFrame으로 DOM 업데이트 후 커서 위치 설정
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  };

  return (
    <textarea
      ref={textareaRef}
      className="w-full h-full resize-none outline-none px-6 py-10 font-sans text-base leading-7 bg-white text-gray-900 placeholder-gray-300"
      value={content}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      spellCheck={false}
    />
  );
}
