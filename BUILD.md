# PDF Handler 빌드 가이드

## Windows에서 빌드하기

### 1. Node.js 설치

https://nodejs.org 에서 **LTS 버전** 다운로드 후 설치.

설치 확인:

```powershell
node --version
npm --version
```

### 2. 프로젝트 준비

프로젝트 폴더를 원하는 위치에 복사한 뒤 해당 폴더에서 터미널(PowerShell)을 열고 의존성 설치:

```powershell
npm install
```

### 3. 빌드

```powershell
# Windows에서 symlink 권한 문제로 빌드 실패 시 아래 환경변수를 설정하세요
$env:CSC_IDENTITY_AUTO_DISCOVERY="false"

npm run package
```

> **참고**: Windows에서 `Cannot create symbolic link` 에러가 발생하면, 코드 서명 캐시의 symlink 생성 권한 문제입니다.
> `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign` 폴더를 삭제한 뒤 위 환경변수를 설정하고 다시 빌드하세요.

빌드가 완료되면 `dist/` 폴더에 설치 파일이 생성됩니다:

```
dist/PDF Handler Setup 1.0.0.exe
```

### 4. 설치 및 실행

생성된 `.exe` 파일을 더블클릭하여 설치합니다.

- 설치 경로를 선택할 수 있습니다
- 바탕화면에 바로가기가 생성됩니다
- 설치 후 바로 실행됩니다

> "Windows의 PC 보호" 경고가 뜨면 "추가 정보" → "실행"을 클릭하세요. (코드 서명이 없어서 나타나는 정상적인 경고입니다)

---

## macOS에서 빌드하기

### 1. Node.js 설치

```bash
# Homebrew 사용 시
brew install node

# 또는 https://nodejs.org 에서 다운로드
```

### 2. 의존성 설치 및 빌드

```bash
npm install
npm run package
```

### 3. 결과물

```
dist/PDF Handler-1.0.0-arm64.dmg   (Apple Silicon)
dist/PDF Handler-1.0.0.dmg          (Intel)
```

DMG를 열어 앱을 Applications 폴더로 드래그하여 설치합니다.

> "확인되지 않은 개발자" 경고 시: 시스템 설정 → 개인정보 보호 및 보안 → "확인 없이 열기" 클릭
