# Requirements Document

## Introduction

React.js + Vite + Tailwind CSS 기반의 웹 메모 앱이다. 사용자는 화면 전체를 차지하는 텍스트 입력창에서 메모를 작성할 수 있다. 새 문서를 열면 오늘 날짜가 자동으로 첫 줄에 입력되고, 엔터를 칠 때마다 현재 시간이 새 줄 앞에 자동으로 삽입된다. 작성이 완료되면 'Copy and New' 버튼으로 내용을 클립보드에 복사하고 새 문서를 시작할 수 있다.

## Glossary

- **App**: 본 웹 메모 애플리케이션 전체
- **Editor**: 사용자가 텍스트를 입력하는 전체 화면 텍스트 입력 영역
- **Document**: Editor에 현재 작성 중인 메모 내용 전체
- **Date_Stamp**: `yyyy.mm.dd` 형식으로 표현된 오늘 날짜 문자열 (예: `2025.07.14`)
- **Time_Stamp**: `hh:mm` 형식으로 표현된 현재 시간 문자열 (예: `09:05`)
- **Clipboard**: 운영체제 또는 브라우저가 제공하는 클립보드
- **LocalStorage**: 브라우저가 제공하는 로컬 영구 저장소 (페이지 새로고침 후에도 데이터 유지)

## Requirements

### Requirement 1: 전체 화면 텍스트 입력창

**User Story:** 사용자로서, 화면 전체를 차지하는 텍스트 입력창을 원한다. 그래야 메모 작성에 집중할 수 있다.

#### Acceptance Criteria

1. THE App SHALL 뷰포트 전체 너비와 높이를 차지하는 Editor를 렌더링한다.
2. THE Editor SHALL 멀티라인 텍스트 입력을 지원한다.
3. THE Editor SHALL 페이지 로드 시 자동으로 포커스를 받는다.

---

### Requirement 2: 새 문서 열기 시 날짜 자동 입력

**User Story:** 사용자로서, 새 문서를 열 때 오늘 날짜가 자동으로 입력되기를 원한다. 그래야 날짜를 직접 입력하는 수고를 덜 수 있다.

#### Acceptance Criteria

1. WHEN 새 Document가 생성될 때, THE Editor SHALL 첫 번째 줄에 Date_Stamp를 자동으로 삽입한다.
2. WHEN 새 Document가 생성될 때, THE Editor SHALL 커서를 Date_Stamp 다음 줄의 맨 앞에 위치시킨다.
3. THE App SHALL Date_Stamp를 `yyyy.mm.dd` 형식으로 생성한다 (예: `2025.07.14`).

---

### Requirement 3: 엔터 입력 시 시간 자동 삽입

**User Story:** 사용자로서, 엔터를 칠 때 현재 시간이 새 줄 앞에 자동으로 입력되기를 원한다. 그래야 메모 항목마다 시간을 기록할 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 Editor에서 Enter 키를 누를 때, THE Editor SHALL 새 줄을 생성하고 줄 맨 앞에 Time_Stamp를 자동으로 삽입한다.
2. WHEN 사용자가 Editor에서 Enter 키를 누를 때, THE Editor SHALL 커서를 Time_Stamp 바로 뒤에 위치시킨다.
3. THE App SHALL Time_Stamp를 `hh:mm` 형식으로 생성한다 (예: `09:05`).
4. THE App SHALL Time_Stamp 생성 시 Enter 키를 누른 시점의 로컬 시간을 사용한다.

---

### Requirement 4: Copy and New 버튼

**User Story:** 사용자로서, 현재 메모를 클립보드에 복사하고 새 문서를 시작하는 버튼을 원한다. 그래야 작성한 내용을 다른 곳에 붙여넣고 새 메모를 바로 시작할 수 있다.

#### Acceptance Criteria

1. THE App SHALL 화면 하단에 'Copy and New' 버튼을 렌더링한다.
2. WHEN 사용자가 'Copy and New' 버튼을 클릭할 때, THE App SHALL 현재 Document의 전체 텍스트를 Clipboard에 복사한다.
3. WHEN 사용자가 'Copy and New' 버튼을 클릭할 때, THE App SHALL 복사 완료 후 Document를 초기화하고 Requirement 2에 따라 새 Document를 생성한다.
4. IF Clipboard 쓰기 권한이 거부된 경우, THEN THE App SHALL 사용자에게 복사 실패를 알리는 메시지를 표시한다.
5. WHEN 'Copy and New' 버튼 클릭 후 복사가 성공한 경우, THE App SHALL 버튼에 복사 성공 피드백(예: 버튼 텍스트 변경 또는 시각적 표시)을 일시적으로 표시한다.

---

### Requirement 5: 로컬스토리지 자동 저장

**User Story:** 사용자로서, 작성 중인 메모가 페이지를 새로고침하거나 브라우저를 닫아도 유지되기를 원한다. 그래야 실수로 페이지를 벗어나도 내용을 잃지 않는다.

#### Acceptance Criteria

1. WHEN 사용자가 Editor의 내용을 변경할 때마다, THE App SHALL 현재 Document의 전체 텍스트를 LocalStorage에 자동으로 저장한다.
2. WHEN 페이지가 로드될 때, THE App SHALL LocalStorage에 저장된 Document가 존재하면 해당 내용을 Editor에 복원한다.
3. WHEN 페이지가 로드될 때, THE App SHALL LocalStorage에 저장된 Document가 없으면 Requirement 2에 따라 새 Document를 생성한다.
4. WHEN 사용자가 'Copy and New' 버튼을 클릭하여 새 Document가 생성될 때, THE App SHALL LocalStorage의 이전 Document 내용을 새 Document 내용으로 덮어쓴다.
