# AppSync 클라이언트 개발자 가이드

브라우저(PWA)에서 AppSync 서버에 직접 연동하는 방법을 설명합니다.
AppSync는 **OAuth Authorization Code Flow (Google 로그인)** 기반으로 사용자를 인증하며,
인증 후 `localStorage`를 여러 기기 간에 동기화합니다.

---

## 목차

1. [아키텍처](#1-아키텍처)
2. [앱 등록](#2-앱-등록)
3. [빠른 시작 — AppSyncStorage SDK (권장)](#3-빠른-시작--appsyncstorage-sdk-권장)
4. [인증 플로우 상세](#4-인증-플로우-상세)
5. [API 레퍼런스](#5-api-레퍼런스)
6. [직접 구현 (Raw API)](#6-직접-구현-raw-api)
7. [토큰 관리](#7-토큰-관리)

---

## 1. 아키텍처

```
[브라우저 (PWA)]
    │
    │  1. GET /authorize?appId=...&redirect_uri=...&state=...
    ▼
[AppSync 서버 — Google 로그인 동의 페이지]
    │
    │  2. 사용자 Google 로그인 완료
    ▼
[AppSync 서버]
    │
    │  3. redirect_uri?code=AUTH_CODE&state=...
    ▼
[브라우저 (콜백 처리)]
    │
    │  4. POST /api/token  { code, appId, redirectUri }
    ▼
[AppSync 서버]
    │
    │  5. { access_token, userId, email, expires_in }
    ▼
[브라우저]
    │
    │  6. POST /api/sync/push   Authorization: Bearer {access_token}
    │     GET  /api/sync/pull   Authorization: Bearer {access_token}
    ▼
[AppSync 서버] → JWT에서 appId 추출 → 사용자·앱별 데이터 격리 → localStorage 동기화
```

**앱별 데이터 격리:** Access Token에 `appId`가 내장되어 있어,
서로 다른 앱의 사용자 데이터가 절대 교차되지 않습니다.

---

## 2. 앱 등록

AppSync를 사용하려면 먼저 앱을 등록하여 `appId`를 발급받아야 합니다.
인증 없이 1회만 실행하면 됩니다.

```bash
curl -X POST https://your-appsync-server.com/apps/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Awesome PWA",
    "redirectUris": [
      "https://my-pwa.com",
      "https://my-pwa.com/callback",
      "http://localhost:3000"
    ]
  }'
```

**응답:**
```json
{ "appId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }
```

> `redirectUris`에 등록되지 않은 URI로 로그인을 시도하면 오류가 발생합니다.
> 개발/프로덕션 환경의 URI를 모두 등록해 두세요.

---

## 3. 빠른 시작 — AppSyncStorage SDK (권장)

AppSync 서버는 `/sdk/appsync.js`를 통해 클라이언트 SDK를 제공합니다.
`localStorage`와 동일한 API로 동기화 기능을 사용할 수 있습니다.

### 설치

빌드 도구 없음. HTML에 script 태그 1줄로 사용합니다.

```html
<script src="https://port-0-appsync-mme8efj9522d498f.sel3.cloudtype.app/sdk/appsync.js"></script>
```

### 초기화

```js
const store = new AppSyncStorage({
  appId:          'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // 필수
  serverUrl:      'https://port-0-appsync-mme8efj9522d498f.sel3.cloudtype.app',      // 필수
  prefix:         'myapp:',   // 선택 — 동기화 대상 key 접두사 (권장)
  autoSync:       true,       // 선택 — 변경 시 자동 push (default: true)
  debounce:       1500,       // 선택 — 자동 push 딜레이 ms (default: 1500)
  staleThreshold: 30000,      // 선택 — 이 시간 이상 미동기화 시 push 전 pull (default: 30000)
})

await store.init()  // 반드시 1회 호출
```

### 로그인

```js
// 현재 창이 Google 로그인 페이지로 이동 후 redirect_uri로 돌아옵니다
await store.login()
```

### 데이터 읽기/쓰기

```js
// localStorage와 완전히 동일한 API
store.setItem('todos', JSON.stringify(todos))   // 쓰기 (자동 sync 예약)
const raw = store.getItem('todos')              // 읽기 (항상 로컬)
store.removeItem('todos')                       // 삭제
store.clear()                                   // prefix 범위 전체 삭제
```

**로컬 우선(Local-First) 전략:**
모든 읽기/쓰기는 즉시 `localStorage`에 반영됩니다. 네트워크 동기화는 백그라운드에서 best-effort로 처리됩니다.

### 이벤트 처리

```js
store.addEventListener('login', (e) => {
  console.log('로그인:', e.detail.email)
  // UI 업데이트, 초기 데이터 로드 등
})

store.addEventListener('logout', () => {
  // 로그인 화면으로 이동
})

store.addEventListener('synced', (e) => {
  // direction: 'push' | 'pull'
  // version: 현재 서버 버전
  // changed: pull 방향일 때 변경된 key 목록 (string[])
  if (e.detail.direction === 'pull' && e.detail.changed.length > 0) {
    loadDataFromLocalStorage()  // 서버 변경사항 반영하여 UI 재렌더링
  }
})

store.addEventListener('conflict', (e) => {
  const { key, local, remote, resolve } = e.detail
  // 기본: 서버 값 적용 (아무것도 하지 않음)
  // 로컬 값 유지: resolve(local)
  // 커스텀 병합: resolve(mergedValue)
})

store.addEventListener('error', (e) => {
  // e.detail.error: string (에러 메시지)
  // e.detail.operation: 'push' | 'pull' | 'token_exchange' 등
  // 앱 동작은 계속됨 — error는 알림용
  console.warn('Sync error:', e.detail.operation, e.detail.error)
})

store.addEventListener('online', (e) => {
  console.log(`네트워크 복구 — 미전송 변경: ${e.detail.pending}건`)
})

store.addEventListener('offline', () => {
  console.log('오프라인 — 로컬 모드로 동작 중')
})
```

### 수동 동기화

```js
await store.push()          // 로컬 변경사항 → 서버 전송
await store.pull()          // 서버 최신 데이터 → 로컬 반영
await store.sync()          // pull → push 순서로 실행 (충돌 최소화)
```

### 전체 예시

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://your-appsync-server.com/sdk/appsync.js"></script>
</head>
<body>
  <script>
    const store = new AppSyncStorage({
      appId: 'YOUR_APP_ID',
      serverUrl: 'https://your-appsync-server.com',
      prefix: 'myapp:',
    })

    store.addEventListener('login', () => renderApp())
    store.addEventListener('logout', () => renderLogin())
    store.addEventListener('synced', (e) => {
      if (e.detail.direction === 'pull') renderApp()
    })

    window.addEventListener('DOMContentLoaded', async () => {
      await store.init()
      store.isLoggedIn() ? renderApp() : renderLogin()
    })

    function renderLogin() {
      document.body.innerHTML = `
        <button onclick="store.login()">Google로 로그인</button>
      `
    }

    function renderApp() {
      const data = JSON.parse(store.getItem('data') ?? '{}')
      document.body.innerHTML = `
        <p>안녕하세요, ${localStorage.getItem('_appsync_email')}</p>
        <button onclick="store.logout()">로그아웃</button>
      `
    }
  </script>
</body>
</html>
```

---

## 4. 인증 플로우 상세

### Redirect 모드

```
브라우저           AppSync 서버
   │  GET /authorize?appId=...&redirect_uri=...&state=...
   │─────────────────────────────────────────────────────▶│
   │  ◀ 200 HTML (Google 로그인 동의 페이지)              │
   │                                                       │
   │  [사용자 Google 계정으로 로그인]                      │
   │                                                       │
   │  ◀ redirect redirect_uri?code=AUTH_CODE&state=...    │
   │                                                       │
   │  POST /api/token { code, appId, redirectUri }         │
   │─────────────────────────────────────────────────────▶│
   │  ◀ { access_token, userId, email, expires_in }        │
```

---

## 5. API 레퍼런스

### POST /apps/register

앱을 등록하고 `appId`를 발급받습니다. 인증 불필요.

**Request Body:**
```json
{
  "name": "My PWA",
  "redirectUris": ["https://my-pwa.com", "http://localhost:3000"]
}
```

**Response `201`:**
```json
{ "appId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }
```

---

### GET /authorize

Google 로그인 동의 페이지를 반환합니다. 브라우저에서 직접 접근.

**Query Parameters:**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| `appId` | ✅ | 등록된 앱 UUID |
| `redirect_uri` | ✅ | 앱 등록 시 설정한 URI 중 하나 |
| `state` | ✅ | CSRF 방지용 난수 (최대 256자) |

로그인 성공 시 `redirect_uri?code=AUTH_CODE&state=STATE`로 리다이렉트합니다.

---

### POST /api/token

Authorization Code를 Access Token으로 교환합니다.

**Request Body:**
```json
{
  "code": "64자 hex 코드",
  "appId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "redirectUri": "https://my-pwa.com",
  "grant_type": "authorization_code"
}
```

**Response `200`:**
```json
{
  "access_token": "eyJ...",
  "userId": "google-sub-id",
  "email": "user@example.com",
  "expires_in": 604800
}
```

| 필드 | 설명 |
|------|------|
| `access_token` | JWT (payload: `{ appId, sub(userId), email }`) |
| `userId` | Google 고유 사용자 ID |
| `email` | 사용자 이메일 |
| `expires_in` | 유효 시간(초). 만료 시각 = `Date.now() + expires_in * 1000` |

---

### POST /api/sync/push

로컬 변경사항을 서버에 전송합니다. **Access Token 필요.**

**Request Body:**
```json
{
  "appId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "version": 5,
  "changes": [
    {
      "key": "myapp:todos",
      "value": [{"id": 1, "text": "할 일", "done": false}],
      "clientUpdatedAt": 1700000000
    },
    {
      "key": "myapp:deleted-item",
      "value": null,
      "clientUpdatedAt": 1700000001
    }
  ]
}
```

| 필드 | 설명 |
|------|------|
| `version` | 클라이언트의 현재 버전 (마지막 성공 sync 시 서버에서 받은 값) |
| `changes[].key` | 동기화할 localStorage key (prefix 포함) |
| `changes[].value` | 저장할 값 (JSON). `null`이면 삭제 |
| `changes[].clientUpdatedAt` | 변경 시각 Unix timestamp (초) |

**Response `200`:**
```json
{ "version": 6 }
```

---

### GET /api/sync/pull

서버의 최신 변경사항을 수신합니다. **Access Token 필요.**

**Query Parameters:**
| 파라미터 | 필수 | 설명 |
|---------|------|------|
| `appId` | ✅ | 앱 UUID |
| `version` | ✅ | 클라이언트 현재 버전 (이 버전 이후 변경사항만 수신) |

**Response `200`:**
```json
{
  "version": 8,
  "delta": [
    {
      "key": "myapp:todos",
      "value": [{"id": 1, "text": "할 일", "done": true}],
      "version": 7,
      "deletedAt": null
    },
    {
      "key": "myapp:old-item",
      "value": null,
      "version": 8,
      "deletedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

| 필드 | 설명 |
|------|------|
| `version` | 서버 현재 최신 버전 |
| `delta` | `version` 이후 변경된 항목 목록 |
| `delta[].deletedAt` | non-null이면 삭제된 항목 |

---

### GET /snapshot/:userId

사용자의 전체 데이터를 조회합니다. 데이터 마이그레이션, 초기 로드 등에 사용. **Access Token 필요.**

`:userId`는 토큰의 `userId`와 일치해야 합니다 (본인 데이터만 접근 가능).

**Response `200`:**
```json
{
  "serverVersion": 8,
  "data": [
    { "key": "myapp:todos", "value": [...], "version": 7 },
    { "key": "myapp:settings", "value": {...}, "version": 3 }
  ]
}
```

---

## 6. 직접 구현 (Raw API)

SDK를 사용하지 않고 직접 구현하는 경우의 참고 코드입니다.

### 토큰 교환

```js
async function exchangeToken(code, appId, redirectUri) {
  const res = await fetch('https://your-appsync-server.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, appId, redirectUri, grant_type: 'authorization_code' }),
  })
  if (!res.ok) throw new Error('Token exchange failed')
  const data = await res.json()
  // data.access_token, data.userId, data.email, data.expires_in
  return data
}
```

### Push

```js
async function pushChanges(accessToken, appId, version, changes) {
  const res = await fetch('https://your-appsync-server.com/api/sync/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ appId, version, changes }),
  })
  if (res.status === 401) throw new Error('Unauthorized — re-login required')
  if (!res.ok) throw new Error('Push failed')
  return res.json()  // { version: newVersion }
}
```

### Pull

```js
async function pullChanges(accessToken, appId, version) {
  const url = new URL('https://your-appsync-server.com/api/sync/pull')
  url.searchParams.set('appId', appId)
  url.searchParams.set('version', version)

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  })
  if (res.status === 401) throw new Error('Unauthorized — re-login required')
  if (!res.ok) throw new Error('Pull failed')
  return res.json()  // { version, delta }
}
```

### 버전 관리

```js
// 로컬에 버전 저장 (sync마다 갱신)
function getLocalVersion() {
  return parseInt(localStorage.getItem('_my_version') ?? '0')
}
function setLocalVersion(v) {
  localStorage.setItem('_my_version', String(v))
}

// 충돌 없는 단순 sync 루프 (pull → push)
async function syncAll(accessToken, appId, pendingChanges) {
  // 1. Pull
  const { version, delta } = await pullChanges(accessToken, appId, getLocalVersion())
  for (const item of delta) {
    if (item.deletedAt) localStorage.removeItem(item.key)
    else localStorage.setItem(item.key, JSON.stringify(item.value))
  }
  setLocalVersion(version)

  // 2. Push
  if (pendingChanges.length > 0) {
    const { version: newVersion } = await pushChanges(accessToken, appId, version, pendingChanges)
    setLocalVersion(newVersion)
  }
}
```

---

## 7. 토큰 관리

| 항목 | 내용 |
|------|------|
| 토큰 유효 기간 | `expires_in` 초 (응답값 기준) |
| 만료 처리 | 서버가 `401` 반환 → 다시 `/authorize` 플로우로 재로그인 |
| 저장 위치 | `localStorage` (SDK는 `_appsync_token`에 저장) |
| Refresh Token | 없음 — 만료 시 재로그인 필요 |
| 자동 갱신 | 현재 미지원. `error` 이벤트(`operation: 'push'|'pull'`) + `logout` 이벤트로 감지 |

**401 처리 패턴 (SDK 사용 시):**
```js
store.addEventListener('logout', () => {
  // 401로 인한 자동 로그아웃 — 로그인 화면으로 이동
  showLoginScreen()
})

store.addEventListener('error', (e) => {
  if (e.detail.error === 'Unauthorized') {
    // logout 이벤트와 함께 발생 — 중복 처리 주의
  }
})
```

---

## 서버 환경 설정 참고

AppSync 서버 운영자를 위한 필수 환경 변수:

```bash
# Google OAuth 클라이언트 ID (Google Cloud Console에서 발급)
GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com

# JWT 서명 시크릿 (최소 32자 무작위 문자열)
JWT_SECRET=your-random-secret-min-32-chars

# 고정 허용 출처 추가 (쉼표 구분, 선택사항 — 개발/관리자 도구용)
# 써드파티 앱 출처는 앱 등록 시 redirectUris에서 자동으로 허용됩니다
CORS_ORIGIN=https://your-admin-dashboard.com,http://localhost:3000
```
