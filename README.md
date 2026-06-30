# QuizNote

GoodNotes 스타일 UI로 전자기학 PDF를 업로드하고, **Anthropic Claude API**로 문제 풀이를 받는 웹/PWA 앱입니다. iPad Safari에서 홈 화면에 추가하면 앱처럼 사용할 수 있습니다.

## 기능

- PDF 업로드 및 페이지별 뷰어
- Apple Pencil / 터치 필기 (펜, 지우개, 색상, 굵기)
- Claude AI 전자기학 문제 분석 및 단계별 풀이
- GoodNotes 느낌의 크림톤 UI
- PWA 지원 (iPad 홈 화면 추가)

## 시작하기

> **처음 받은 사람:** 로컬 실행·Vercel 배포·AI 에이전트에 붙여넣을 명령문은 **[SETUP.md](./SETUP.md)** 를 보세요.

### 1. API 키 설정

[Anthropic Console](https://console.anthropic.com/settings/keys)에서 발급한 API 키를 `.env.local`에 넣습니다.

```bash
cp .env.example .env.local
# .env.local 파일을 열어 ANTHROPIC_API_KEY=... 입력
```

### 2. 개발 서버 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 3. iPad에서 사용 (PWA)

1. iPad Safari에서 앱 URL 접속
2. 공유 버튼 → **홈 화면에 추가**
3. Apple Pencil로 PDF 위에 필기 가능

## 사용법

1. 왼쪽 사이드바 또는 상단 **업로드**로 전자기학 PDF 선택
2. PDF 위에 펜으로 메모/풀이 (선택)
3. 오른쪽 패널에 추가 질문 입력 (선택)
4. **AI 분석** 버튼 클릭 → Claude가 문제를 분석하고 풀이 제공

## 기술 스택

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- react-pdf (PDF 뷰어)
- @anthropic-ai/sdk (Claude API)
- Canvas API (필기)

## 프로젝트 구조

```
app/
  api/analyze/route.ts   # Claude PDF 분석 API
  page.tsx               # 메인 페이지
components/
  QuizApp.tsx            # 앱 상태 관리
  DocumentLibrary.tsx    # 문서 목록
  EditorShell.tsx          # 편집 화면
  PdfCanvas.tsx            # PDF + 필기 캔버스
  EditorToolbar.tsx        # 도구 모음
lib/
  claude.ts              # Claude 클라이언트
  constants.ts           # 상수 및 기본 프롬프트
```

## 배포 (Vercel)

자세한 배포 절차·환경변수·트러블슈팅·AI 에이전트 명령문: **[SETUP.md](./SETUP.md)**

```bash
npm run build
```

Vercel에 배포 시 최소 `ANTHROPIC_API_KEY`, `APP_SECRET`, `APP_PASSWORD_HASH` 환경변수를 설정하세요.

## 주의사항

- API 키는 서버 사이드(`ANTHROPIC_API_KEY`)에만 저장됩니다. 클라이언트에 노출되지 않습니다.
- PDF 파일 크기 제한: 20MB
- Claude 모델: `claude-sonnet-4-20250514` (`CLAUDE_MODEL` 환경변수로 변경 가능)
