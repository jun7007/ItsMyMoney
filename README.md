# ItsMyMoney

개인 주식 포트폴리오 관리 앱 — 매수/매도 이력, 실시간 손익, 종목 뉴스를 한곳에서 관리합니다.

## 주요 기능

- **보유 종목 관리** — 한국(코스피/코스닥) + 미국 주식
- **매수/매도 기록** — 거래 이력 저장 및 평균 단가 자동 계산
- **실시간 손익** — Yahoo Finance 시세 연동, 60초 자동 갱신
- **종목 뉴스** — 종목별 관련 뉴스 조회
- **SQLite 저장** — 모든 데이터 로컬 영구 보관
- **모바일 접속** — 집 Wi-Fi 및 Tailscale로 외부 접속

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | SQLite (better-sqlite3) |
| 시세/뉴스 | Yahoo Finance (yahoo-finance2) |

## 빠른 시작

```bash
git clone https://github.com/jun7007/ItsMyMoney.git
cd ItsMyMoney
npm install
copy .env.example .env    # Windows
npm run build
npm start
```

브라우저에서 **http://localhost:3000** 접속

## 상세 문서

- [설치 가이드](docs/SETUP.md) — 전체 설치, 환경 설정, 자동 시작, 백업
- [모바일 접속 가이드](docs/MOBILE_ACCESS.md) — Wi-Fi, Tailscale, 방화벽 설정

## 프로젝트 구조

```
ItsMyMoney/
├── client/          # React + Vite + Tailwind 프론트엔드
├── server/          # Express + SQLite 백엔드
├── docs/            # 설치 및 접속 가이드
├── .env.example     # 환경 변수 예시
└── package.json     # 루트 스크립트
```

## 사용 방법

### 1. 종목 등록

**거래 기록** 탭 → 새 종목 티커 입력 → **등록**

| 시장 | 티커 예시 |
|------|-----------|
| 미국 | `AAPL`, `MSFT` |
| 한국 코스피 | `005930.KS` |
| 한국 코스닥 | `035720.KQ` |

### 2. 매수/매도 기록

종목 선택 → 매수/매도 → 수량, 단가, 수수료, 거래일시 입력 → **거래 저장**

### 3. 손익 확인

**대시보드** 또는 **보유 종목** 탭에서 실시간 손익 확인. 종목 카드를 누르면 상세 정보와 뉴스를 볼 수 있습니다.

## 개발

```bash
npm run dev     # 프론트(5173) + 백엔드(3000) 동시 실행
npm run build   # 프론트엔드 프로덕션 빌드
npm start       # 프로덕션 서버 시작
```

## 데이터 위치

```
server/data/itsmymoney.db
```

이 파일을 백업하면 모든 주식 데이터가 보존됩니다.

## 라이선스

Private — 개인 사용
