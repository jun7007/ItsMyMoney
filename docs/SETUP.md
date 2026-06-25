# ItsMyMoney 설치 가이드

개인 주식 포트폴리오 관리 앱을 집 PC에 설치하고 실행하는 방법입니다.

## 1. 사전 요구사항

| 항목 | 권장 버전 | 확인 방법 |
|------|-----------|-----------|
| Node.js | 20 LTS 이상 | `node -v` |
| npm | 10 이상 | `npm -v` |
| Git | 최신 | `git -v` |
| Tailscale (외부 접속 시) | 최신 | [tailscale.com](https://tailscale.com) |

> **Windows 참고:** `better-sqlite3`는 네이티브 모듈이라 설치 시 C++ 빌드 도구가 필요할 수 있습니다. 오류가 나면 [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)의 "Desktop development with C++" 워크로드를 설치하세요.

## 2. GitHub에서 클론

```bash
git clone https://github.com/jun7007/ItsMyMoney.git
cd ItsMyMoney
```

## 3. 의존성 설치

```bash
npm install
```

SSL 인증서 오류가 발생하면 (회사 네트워크 등):

```powershell
# Windows PowerShell
$env:NODE_OPTIONS="--use-system-ca"
npm install
```

## 4. 환경 변수 설정

```bash
copy .env.example .env
```

`.env` 파일 내용:

```env
# 서버 포트 (기본: 3000)
PORT=3000

# 바인딩 주소 (0.0.0.0 = LAN/Tailscale 접속 허용)
HOST=0.0.0.0

# 선택: API 접근 PIN (설정 시 X-Access-Pin 헤더 필요)
# ACCESS_PIN=1234

# 시세 캐시 TTL (초)
PRICE_CACHE_TTL=60
```

## 5. 빌드 및 실행

### 프로덕션 모드 (집 PC 상시 구동용)

```bash
npm run build
npm start
```

브라우저에서 `http://localhost:3000` 접속

### 개발 모드 (코드 수정 시)

```bash
npm run dev
```

- 프론트엔드: `http://localhost:5173` (API는 3000으로 프록시)
- 백엔드: `http://localhost:3000`

## 6. 데스크톱 브라우저 접속

서버 시작 후 콘솔에 표시되는 주소로 접속합니다:

```
ItsMyMoney server running on port 3000
  Local:   http://localhost:3000
  Network:
    http://192.168.0.10:3000
```

## 7. 모바일 접속 (집 Wi-Fi)

1. PC와 모바일이 **같은 Wi-Fi**에 연결되어 있는지 확인
2. PC의 LAN IP 확인 (서버 시작 시 콘솔에 표시)
3. 모바일 브라우저에서 `http://192.168.x.x:3000` 접속
4. Windows 방화벽 설정 필요 시 → [MOBILE_ACCESS.md](./MOBILE_ACCESS.md) 참고

## 8. 모바일 접속 (집 밖 / Tailscale)

집 밖에서도 접속하려면 Tailscale을 사용합니다. 자세한 내용은 [MOBILE_ACCESS.md](./MOBILE_ACCESS.md)를 참고하세요.

## 9. PC 부팅 시 자동 시작

### 방법 A: Windows 작업 스케줄러

1. **작업 스케줄러** 실행 → **기본 작업 만들기**
2. 트리거: **컴퓨터를 시작할 때**
3. 동작: **프로그램 시작**
   - 프로그램: `C:\Program Files\nodejs\node.exe`
   - 인수: `C:\path\to\ItsMyMoney\server\src\index.js`
   - 시작 위치: `C:\path\to\ItsMyMoney`
4. 또는 배치 파일 사용:

```bat
@echo off
cd /d C:\path\to\ItsMyMoney
call npm start
```

### 방법 B: pm2 (권장)

```bash
npm install -g pm2
cd ItsMyMoney
npm run build
pm2 start server/src/index.js --name itsmymoney
pm2 save
pm2 startup
```

## 10. 데이터 백업

모든 주식 데이터는 SQLite 파일에 저장됩니다:

```
server/data/itsmymoney.db
```

정기적으로 이 파일을 USB, 클라우드 등에 복사해 백업하세요.

복원 시: 백업 파일을 같은 경로에 덮어쓰면 됩니다.

## 11. 종목 티커 입력 규칙

| 시장 | 예시 | 형식 |
|------|------|------|
| 미국 | Apple | `AAPL` |
| 미국 | Microsoft | `MSFT` |
| 한국 코스피 | 삼성전자 | `005930.KS` |
| 한국 코스닥 | 카카오 | `035720.KQ` |

종목 등록 시 Yahoo Finance API로 티커를 자동 검증합니다.

## 12. 트러블슈팅

### 포트가 이미 사용 중

```
Error: listen EADDRINUSE :::3000
```

`.env`에서 `PORT=3001` 등 다른 포트로 변경

### better-sqlite3 설치 실패

- Node.js 20 LTS 사용 권장
- Visual Studio Build Tools 설치
- `$env:NODE_OPTIONS="--use-system-ca"` 후 재시도

### 시세/뉴스가 안 나옴 (Yahoo Finance 오류)

- Yahoo Finance API는 무료이지만 요청 제한(429)이 있을 수 있습니다
- 잠시 후 다시 시도하거나 `PRICE_CACHE_TTL`을 늘려보세요
- 회사/학교 네트워크에서 Yahoo 차단 여부 확인

### 모바일에서 접속 안 됨

- PC와 모바일이 같은 Wi-Fi인지 확인
- Windows 방화벽에서 포트 허용 → [MOBILE_ACCESS.md](./MOBILE_ACCESS.md)
- `HOST=0.0.0.0` 설정 확인

### PIN 설정 후 접속 불가

`.env`에 `ACCESS_PIN`을 설정한 경우, 브라우저 개발자 도구 콘솔에서:

```javascript
localStorage.setItem('itsmymoney_pin', '1234');
```

페이지를 새로고침하세요.
