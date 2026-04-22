# Implementation Tasks

## Task 1: 프로젝트 초기화
- [ ] Vite + React 프로젝트 생성
- [ ] Tailwind CSS 설치 및 설정
- [ ] 불필요한 보일러플레이트 제거

## Task 2: 유틸 함수 작성
- [ ] `src/utils/datetime.js` 생성
- [ ] `getDateStamp()` — yyyy.mm.dd 반환
- [ ] `getTimeStamp()` — hh:mm 반환

## Task 3: Editor 컴포넌트
- [ ] `src/components/Editor.jsx` 생성
- [ ] 전체 화면 textarea (w-full h-full, resize-none)
- [ ] Enter 키 이벤트 핸들러 (시간 자동 삽입)
- [ ] 커서 위치 제어 (setSelectionRange)
- [ ] 페이지 로드 시 자동 포커스

## Task 4: Toolbar 컴포넌트
- [ ] `src/components/Toolbar.jsx` 생성
- [ ] 하단 고정 'Copy and New' 버튼
- [ ] 클립보드 복사 로직 (navigator.clipboard.writeText)
- [ ] 복사 성공/실패 피드백 (버튼 텍스트 일시 변경)

## Task 5: App.jsx 조립
- [ ] content 상태 관리
- [ ] localStorage 복원 로직 (초기 로드)
- [ ] onChange → localStorage 자동 저장
- [ ] 새 문서 생성 함수 (날짜 삽입 + localStorage 갱신)
- [ ] Editor, Toolbar 조합
