import { useRef, useEffect } from 'react';
import { getTimeStamp } from '../utils/datetime';

/**
 * 커서가 있는 줄이 보이도록 textarea를 스크롤
 */
function scrollToCursor(textarea) {
  // 커서 위치까지의 텍스트로 임시 div를 만들어 높이 측정
  const style = window.getComputedStyle(textarea);
  const mirror = document.createElement('div');

  mirror.style.cssText = `
    position: absolute;
    visibility: hidden;
    white-space: pre-wrap;
    word-wrap: break-word;
    width: ${textarea.clientWidth}px;
    font: ${style.font};
    padding: ${style.padding};
    border: ${style.border};
    line-height: ${style.lineHeight};
    box-sizing: border-box;
  `;

  const textBeforeCursor = textarea.value.slice(0, textarea.selectionStart);
  mirror.textContent = textBeforeCursor;

  // 커서 위치 마커
  const marker = document.createElement('span');
  marker.textContent = '|';
  mirror.appendChild(marker);

  document.body.appendChild(mirror);
  const cursorTop = marker.offsetTop;
  document.body.removeChild(mirror);

  const lineHeight = parseInt(style.lineHeight) || 28;
  const visibleHeight = textarea.clientHeight;

  // 커서가 보이는 영역 밖이면 스크롤
  if (cursorTop < textarea.scrollTop) {
    textarea.scrollTop = cursorTop - lineHeight;
  } else if (cursorTop + lineHeight > textarea.scrollTop + visibleHeight) {
    textarea.scrollTop = cursorTop + lineHeight * 2 - visibleHeight;
  }
}

/**
 * 전체 화면 텍스트 에디터 컴포넌트
 * - Enter: 줄바꿈 + 현재 시간 자동 삽입
 * - Shift+Enter: 줄바꿈만
 * - 페이지 로드 시 자동 포커스
 */
export default function Editor({ content, onChange }) {
  const textareaRef = useRef(null);

  // 페이지 로드 시 자동 포커스
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return;

    // Shift+Enter: 일반 줄바꿈만
    if (e.shiftKey) return;

    // Enter: 줄바꿈 + 시간 자동 삽입
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

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        scrollToCursor(textareaRef.current);
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
