# Technical Design

## Architecture Overview

단일 페이지 React 앱. Vite로 번들링, Tailwind CSS로 스타일링.

```
src/
├── App.jsx          # 루트 컴포넌트, 상태 관리
├── hooks/
│   └── useMemo.js   # 에디터 로직 (날짜/시간 삽입, localStorage)
├── components/
│   ├── Editor.jsx   # 전체 화면 textarea
│   └── Toolbar.jsx  # 하단 Copy and New 버튼
└── utils/
    └── datetime.js  # 날짜/시간 포맷 유틸
```

## Component Design

### App.jsx
- `content` state 관리
- localStorage 초기화 로직
- Editor, Toolbar에 props 전달

### Editor.jsx
- `<textarea>` 전체 화면 (w-full h-full)
- `onKeyDown` 핸들러: Enter 감지 → 시간 삽입
- `ref`로 커서 위치 제어

### Toolbar.jsx
- 하단 고정 버튼 영역
- Copy and New 버튼
- 복사 성공/실패 피드백 상태

## Key Logic

### 날짜 포맷 (datetime.js)
```js
getDateStamp()  // → "2026.04.22"
getTimeStamp()  // → "09:05"
```

### Enter 키 처리 (Editor.jsx)
1. `e.preventDefault()` — 기본 줄바꿈 차단
2. 현재 커서 위치 앞뒤 텍스트 분리
3. `\n` + TimeStamp + ` ` 삽입
4. `setSelectionRange`로 커서를 TimeStamp 뒤로 이동

### localStorage
- 키: `memo-app-content`
- 저장: `onChange` 마다 `localStorage.setItem`
- 복원: 앱 초기화 시 `localStorage.getItem`
