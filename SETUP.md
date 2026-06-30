# QuizNote — 받는 사람용 설정·배포 가이드

이 문서는 **프로젝트를 받은 사람**이 직접 배포해서 쓸 때 필요한 내용입니다.  
Cursor 등 AI 에이전트에게 **아래 명령문을 그대로 복사**해서 붙여넣으면 됩니다.

---

## 시작 전에 준비할 것

| 항목 | 설명 |
|------|------|
| Node.js | 20 이상 권장 |
| npm | `package.json` 기준 |
| Anthropic API 키 | [Console](https://console.anthropic.com/settings/keys)에서 발급 |
| GitHub 계정 | Vercel 배포 시 (선택) |
| Vercel 계정 | 웹 배포 시 (선택, 이 프로젝트는 Vercel 설정 포함) |

> **주의:** `.env.local`은 절대 Git에 올리지 마세요. API 키와 로그인 비밀번호가 들어갑니다.

---

## 환경변수 한눈에 보기

| 변수 | 필수 | 설명 |
|------|------|------|
| `ANTHROPIC_API_KEY` | ✅ | Claude API 키 (서버 전용) |
| `APP_SECRET` | 프로덕션 ✅ | 세션 서명용, **32자 이상** 랜덤 문자열 |
| `APP_PASSWORD_HASH` | 프로덕션 ✅ | 로그인 비밀번호 해시 (`scripts/hash-password.js`로 생성) |
| `CLAUDE_MODEL` | 선택 | 기본값 `claude-sonnet-4-20250514` |
| `TOTP_SECRET` | 선택 | 2단계 인증 켤 때 |
| `ALLOWED_ORIGINS` | 선택 | CORS 허용 도메인 (쉼표 구분, 예: `https://my-app.vercel.app`) |

- **로컬 개발:** `ANTHROPIC_API_KEY`만 있어도 동작합니다 (인증 없이 접근 가능).
- **프로덕션 배포:** `ANTHROPIC_API_KEY` + `APP_SECRET` + `APP_PASSWORD_HASH` **세 개 모두 필수**입니다. 없으면 503 에러가 납니다.

---

## 빠른 로컬 실행 (직접 할 때)

```bash
cp .env.example .env.local
# .env.local 에 ANTHROPIC_API_KEY=sk-ant-... 입력

npm install
npm run dev
```

브라우저: http://localhost:3000

---

## AI 에이전트에게 부탁할 명령 (복사용)

아래에서 **본인 상황에 맞는 블록 하나**를 통째로 복사해서 에이전트 채팅에 붙여넣으세요.

---

### 1) 로컬 개발 환경 세팅

```
이 QuizNote 프로젝트를 로컬에서 실행할 수 있게 도와줘.

해야 할 일:
1. .env.example 을 복사해서 .env.local 만들기
2. ANTHROPIC_API_KEY 는 내가 직접 입력할 테니 placeholder 로 두기
3. npm install 후 npm run dev 실행
4. http://localhost:3000 접속 확인
5. 에러 나면 원인 분석하고 수정 제안

참고:
- 로컬(dev)에서는 APP_SECRET, APP_PASSWORD_HASH 없이도 동작함
- API 키는 lib/claude.ts 에서 ANTHROPIC_API_KEY 로 읽음
- .env.local 은 git 에 커밋하지 말 것
```

---

### 2) 로그인 비밀번호 + APP_SECRET 생성

```
이 프로젝트 프로덕션 배포용 인증 환경변수를 만들어줘.

해야 할 일:
1. node scripts/hash-password.js "내가_정한_비밀번호" 실행해서 APP_PASSWORD_HASH 생성
2. APP_SECRET 은 32자 이상 랜덤 문자열로 생성 (openssl rand -base64 32 등)
3. 결과를 .env.local 형식으로 정리해서 보여주기
4. 배포 플랫폼(Vercel)에 넣을 때 어떤 이름으로 넣는지 표로 정리

참고:
- 프로덕션에서는 APP_SECRET + APP_PASSWORD_HASH 없으면 middleware 가 503 반환
- 비밀번호 원문은 env 파일에 넣지 말고 해시만 저장
```

---

### 3) Vercel 배포 (권장)

```
이 Next.js QuizNote 프로젝트를 Vercel 에 배포해줘.

프로젝트 정보:
- Next.js 16 App Router
- vercel.json 에 analyze API maxDuration 60초 설정됨
- 빌드: npm run build

배포 시 환경변수 (Production):
- ANTHROPIC_API_KEY = (내 Claude API 키)
- APP_SECRET = (32자 이상 랜덤)
- APP_PASSWORD_HASH = (scripts/hash-password.js 로 생성한 값)
- ALLOWED_ORIGINS = https://배포된-도메인.vercel.app (선택)

해야 할 일:
1. GitHub 레포 연결 또는 vercel CLI 로 배포
2. 위 환경변수 설정 방법 안내
3. 배포 후 /login 에서 로그인 되는지 확인
4. PDF 업로드 후 AI 분석 버튼 동작 확인
5. 실패 시 Vercel 로그 기준으로 원인 분석

주의:
- .env.local 은 Vercel 대시보드 Environment Variables 에 수동 입력
- API 키는 서버 사이드 전용, 클라이언트에 노출 금지
```

---

### 4) 배포 후 로그인 / AI 분석이 안 될 때

```
QuizNote 를 배포했는데 문제가 있어. 아래 증상을 보고 원인 찾고 고쳐줘.

증상: (여기에 적기 — 예: 로그인 503, AI 분석 502, CORS 에러 등)

확인해줄 것:
1. middleware.ts — 프로덕션에서 APP_SECRET, APP_PASSWORD_HASH 필수 여부
2. lib/claude.ts — ANTHROPIC_API_KEY 설정 여부
3. Vercel 환경변수가 Production 에만 있고 Preview 에 없는지
4. ALLOWED_ORIGINS 가 배포 URL 과 일치하는지
5. npm run build 로 로컬 빌드 통과하는지

수정이 필요하면 변경 파일과 이유를 설명해줘.
```

---

### 5) 2단계 인증(TOTP) 켜기

```
QuizNote 에 TOTP 2단계 인증을 설정해줘.

해야 할 일:
1. TOTP_SECRET 생성 방법 안내 (otplib 기반, lib/auth.ts 참고)
2. Vercel / .env.local 에 TOTP_SECRET 추가
3. 로그인 화면에서 TOTP 코드 입력 흐름 확인
4. Google Authenticator 등에 등록하는 URI 생성 방법 설명

참고: TOTP_SECRET 이 없으면 비밀번호만으로 로그인됨
```

---

### 6) Claude 모델 변경

```
QuizNote 의 Claude 모델을 바꾸고 싶어.

목표 모델: (예: claude-3-5-sonnet-latest)

해야 할 일:
1. CLAUDE_MODEL 환경변수로 변경 가능한지 lib/constants.ts, lib/claude.ts 확인
2. .env.local / Vercel 에 CLAUDE_MODEL 설정 방법 안내
3. 이미지 분석(vision) 지원 모델인지 확인
4. 변경 후 AI 분석 한 번 테스트
```

---

## 배포 후 체크리스트

- [ ] `https://내-도메인/login` 접속됨
- [ ] 설정한 비밀번호로 로그인됨
- [ ] PDF 업로드 가능
- [ ] **AI 분석** 버튼 눌렀을 때 Claude 풀이가 나옴
- [ ] iPad Safari → 홈 화면에 추가 (PWA) 동작 확인

---

## 자주 나는 문제

| 증상 | 원인 | 해결 |
|------|------|------|
| `APP_PASSWORD_HASH / APP_SECRET 미설정` (503) | 프로덕션 인증 env 누락 | Vercel에 `APP_SECRET`, `APP_PASSWORD_HASH` 추가 |
| `ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다` | API 키 없음 | `ANTHROPIC_API_KEY` 설정 후 재배포 |
| `API 키를 확인해주세요` | 잘못된 키 | Anthropic Console에서 키 재발급 |
| CORS blocked | `ALLOWED_ORIGINS` 불일치 | 배포 URL을 `ALLOWED_ORIGINS`에 추가 |
| AI 분석 타임아웃 | PDF/이미지 큼 | 20MB 이하, `vercel.json` maxDuration 60초 확인 |

---

## 프로젝트 구조 (에이전트 참고용)

```
app/api/analyze/route.ts   ← PDF 페이지 이미지 → Claude 분석
app/api/auth/login/route.ts ← 로그인
lib/claude.ts              ← Anthropic SDK 호출
lib/constants.ts           ← 프롬프트, 모델명
middleware.ts              ← 인증·CSRF·CORS
scripts/hash-password.js   ← APP_PASSWORD_HASH 생성
.env.example               ← 환경변수 템플릿 (더미 값)
```

---

## 공유할 때 빼야 할 것

다른 사람에게 폴더/zip 보낼 때 **포함하지 말 것:**

- `.env.local` (실제 API 키·비밀번호)
- `node_modules/`
- `.next/`
- `.vercel/`

**포함해야 할 것:**

- `.env.example` (더미 placeholder)
- `SETUP.md` (이 파일)
- `README.md`
