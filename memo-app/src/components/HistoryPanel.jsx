import { useEffect, useRef } from 'react';

/**
 * 히스토리 사이드 패널
 * - 최근 7일치 메모 목록 표시
 * - 항목 클릭 시 에디터에 불러오기
 */
export default function HistoryPanel({ items, onLoad, onClose }) {
  const panelRef = useRef(null);

  // 패널 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // 날짜별 그룹핑
  const grouped = items.reduce((acc, item) => {
    const label = formatDateLabel(item.date);
    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {});

  return (
    <div
      ref={panelRef}
      className="absolute bottom-16 left-1/2 -translate-x-1/2 w-80 max-h-96 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden flex flex-col z-40"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-700">최근 기록</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">저장된 기록이 없습니다</p>
        ) : (
          Object.entries(grouped).map(([dateLabel, groupItems]) => (
            <div key={dateLabel}>
              <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 font-medium sticky top-0">
                {dateLabel}
              </div>
              {groupItems.map((item) => (
                <button
                  key={item.timestamp}
                  onClick={() => onLoad(item.content)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 transition-colors"
                >
                  <div className="text-xs text-gray-400 mb-1">
                    {formatTime(item.timestamp)}
                  </div>
                  <div className="text-sm text-gray-700 truncate">
                    {item.preview || '(빈 메모)'}
                  </div>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatDateLabel(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (dateStr === today) return '오늘';
  if (dateStr === yesterday) return '어제';

  // yyyy-mm-dd → mm.dd
  const [, mm, dd] = dateStr.split('-');
  return `${mm}.${dd}`;
}

function formatTime(isoString) {
  const d = new Date(isoString);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
