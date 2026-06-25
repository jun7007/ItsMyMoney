# 모바일 접속 가이드

ItsMyMoney는 집 PC에서 서버를 실행하고, 모바일 브라우저로 접속하는 방식입니다.

## 접속 방식 비교

| 방식 | 사용 상황 | URL 예시 |
|------|-----------|----------|
| LAN (Wi-Fi) | 집 안, 같은 Wi-Fi | `http://192.168.0.10:3000` |
| Tailscale | 집 밖, 외부 네트워크 | `http://100.64.0.5:3000` |

---

## 1. 집 Wi-Fi에서 접속 (LAN)

### 1-1. 서버 실행

```bash
npm run build
npm start
```

콘솔에 표시되는 Network 주소를 확인합니다:

```
Network:
  http://192.168.0.10:3000
```

### 1-2. PC IP 직접 확인 (Windows)

```powershell
ipconfig
```

`무선 LAN 어댑터 Wi-Fi` 또는 `이더넷 어댑터` 항목의 **IPv4 주소**를 확인합니다.

### 1-3. 모바일에서 접속

1. 모바일 Wi-Fi를 PC와 **동일한 네트워크**로 연결
2. 모바일 브라우저(Chrome, Safari 등) 열기
3. 주소창에 `http://192.168.x.x:3000` 입력

### 1-4. Windows 방화벽 설정

모바일에서 접속이 안 되면 방화벽에서 포트를 허용해야 합니다.

**PowerShell (관리자 권한):**

```powershell
New-NetFirewallRule -DisplayName "ItsMyMoney" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

또는 Windows 설정 → **개인 정보 보호 및 보안** → **Windows 보안** → **방화벽 및 네트워크 보호** → **고급 설정** → **인바운드 규칙** → **새 규칙** → 포트 3000 TCP 허용

### 1-5. 홈 화면에 추가 (PWA)

**iOS (Safari):**
1. ItsMyMoney 페이지 열기
2. 공유 버튼 → **홈 화면에 추가**

**Android (Chrome):**
1. ItsMyMoney 페이지 열기
2. 메뉴(⋮) → **홈 화면에 추가** 또는 **앱 설치**

---

## 2. 집 밖에서 접속 (Tailscale)

Tailscale은 개인 VPN으로, 포트포워딩 없이 안전하게 집 PC에 접속할 수 있습니다.

### 2-1. Tailscale 설치

1. [tailscale.com/download](https://tailscale.com/download) 에서 다운로드
2. **집 PC**와 **모바일** 모두에 Tailscale 설치
3. 동일한 Google/Apple/Microsoft 계정으로 로그인

### 2-2. 집 PC에서 서버 실행

```bash
npm start
```

### 2-3. Tailscale IP 확인

**집 PC에서:**

- Tailscale 앱 또는 [Tailscale Admin Console](https://login.tailscale.com/admin/machines)에서 PC의 Tailscale IP 확인
- 형식: `100.x.x.x`

**PowerShell:**

```powershell
tailscale ip
```

### 2-4. 모바일에서 접속

1. 모바일에서 Tailscale 앱 실행 (연결 상태 확인)
2. 브라우저에서 `http://100.x.x.x:3000` 접속

> Tailscale은 암호화된 터널을 사용하므로 공유기 포트포워딩이 필요 없습니다.

### 2-5. Tailscale MagicDNS (선택)

Tailscale Admin에서 MagicDNS를 활성화하면 IP 대신 기기 이름으로 접속할 수 있습니다:

```
http://desktop-pc:3000
```

---

## 3. 보안 권장사항

### ACCESS_PIN 설정 (권장)

외부(Tailscale)에서 접속할 경우 PIN 설정을 권장합니다.

`.env` 파일:

```env
ACCESS_PIN=your-secret-pin
```

브라우저에서 PIN 등록 (개발자 도구 콘솔):

```javascript
localStorage.setItem('itsmymoney_pin', 'your-secret-pin');
location.reload();
```

### 주의사항

- ItsMyMoney는 **개인용 로컬 서버**입니다. 공인 인터넷에 직접 노출하지 마세요.
- 포트포워딩 대신 **Tailscale** 사용을 권장합니다.
- DB 파일(`server/data/itsmymoney.db`)은 PC에만 저장됩니다.

---

## 4. 트러블슈팅

### LAN에서 접속 안 됨

- [ ] PC와 모바일이 같은 Wi-Fi인지 확인
- [ ] `HOST=0.0.0.0` 설정 확인
- [ ] Windows 방화벽 포트 3000 허용
- [ ] 공유기 **AP 격리(Client Isolation)** 기능이 켜져 있으면 끄기

### Tailscale에서 접속 안 됨

- [ ] PC와 모바일 모두 Tailscale 연결 상태인지 확인
- [ ] 집 PC에서 `npm start`로 서버가 실행 중인지 확인
- [ ] Tailscale IP가 맞는지 재확인 (`tailscale ip`)

### 페이지는 열리지만 API 오류

- [ ] `npm run build` 후 `npm start`로 프로덕션 모드 실행했는지 확인
- [ ] `ACCESS_PIN` 설정 시 localStorage에 PIN이 등록되어 있는지 확인

### 시세가 갱신되지 않음

- 앱은 60초마다 자동 갱신합니다
- 수동 새로고침 버튼을 눌러보세요
- Yahoo Finance API 일시적 제한일 수 있습니다
