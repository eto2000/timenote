/**
 * 새 버전 업데이트 알림 토스트
 */
export default function UpdateToast({ onUpdate }) {
  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg z-50">
      <span>새 버전이 있습니다</span>
      <button
        onClick={onUpdate}
        className="bg-white text-gray-900 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100 transition-colors"
      >
        업데이트
      </button>
    </div>
  );
}
