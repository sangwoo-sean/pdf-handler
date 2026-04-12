# PDF Merger

여러 PDF 파일을 하나로 병합하는 데스크톱 애플리케이션입니다.

## 기능

- PDF 파일 다중 선택 및 추가
- 파일 목록에서 순서 변경 (위/아래 이동)
- 개별 파일 제거
- 전체 페이지 수 실시간 표시
- 선택한 순서대로 PDF 병합 및 저장

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Electron 35 + React 19 |
| 언어 | TypeScript 5.8 |
| 빌드 | electron-vite + Vite 6 |
| PDF 처리 | pdf-lib |
| 테스트 | Vitest + React Testing Library |

## 프로젝트 구조

```
pdf-merger/
├── electron/
│   ├── main.ts           # 메인 프로세스 (윈도우 생성, IPC 핸들러)
│   ├── preload.ts        # 프리로드 스크립트 (contextBridge)
│   └── pdf-service.ts    # PDF 처리 로직 (페이지 수 조회, 병합)
├── src/
│   ├── App.tsx           # 루트 컴포넌트
│   ├── components/       # UI 컴포넌트
│   ├── hooks/            # 커스텀 훅 (useFileList)
│   ├── styles/           # CSS Modules
│   └── types/            # TypeScript 타입 정의
└── tests/                # 유닛/통합 테스트
```

## 시작하기

### 필수 요구사항

- Node.js 18+
- npm

### 설치

```bash
npm install
```

### 개발 모드

```bash
npm run dev
```

### 빌드 및 패키징

```bash
# 프로덕션 빌드
npm run build

# 설치 파일 생성
npm run package
```

### 테스트

```bash
# 테스트 실행
npm test

# 테스트 watch 모드
npm run test:watch

# 타입 체크
npm run typecheck
```

## 사용 방법

1. **파일 추가** - "파일 추가" 버튼으로 병합할 PDF 파일을 선택합니다.
2. **순서 조정** - 위/아래 버튼으로 병합 순서를 조정합니다.
3. **병합** - "병합" 버튼을 클릭하고 저장 위치를 지정합니다.

## 아키텍처

Electron의 프로세스 분리 모델을 따릅니다:

- **메인 프로세스** (`electron/main.ts`) - 파일 시스템 접근, 다이얼로그, PDF 처리
- **프리로드** (`electron/preload.ts`) - `contextBridge`로 안전한 IPC 채널 노출
- **렌더러** (`src/`) - React UI, `window.electronAPI`를 통해 메인 프로세스와 통신

보안을 위해 `sandbox: true`와 `contextIsolation`을 적용하여 렌더러 프로세스에서 Node.js API에 직접 접근할 수 없도록 격리합니다.

## 라이선스

MIT
