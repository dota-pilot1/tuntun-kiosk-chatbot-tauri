# 릴리즈 가이드

튼튼 키오스크 데스크톱 앱의 설치 파일 배포 절차입니다.

## 배포하기

버전 태그를 푸시하면 GitHub Actions 가 Windows/macOS 설치 파일을 빌드해
GitHub Release 에 올립니다.

```bash
# 1. package.json 과 src-tauri/tauri.conf.json 의 version 을 올린다
# 2. 커밋 후 태그 푸시
git tag v0.1.1
git push origin v0.1.1
```

Actions 탭에서 `Tauri Release` 워크플로를 수동 실행(workflow_dispatch)할 수도 있습니다.

산출물:

| 플랫폼 | 파일 |
| --- | --- |
| Windows | NSIS 설치 파일 `.exe` |
| macOS | universal `.dmg` (Intel + Apple Silicon) |

## GitHub Secrets

| Secret | 용도 | 상태 |
| --- | --- | --- |
| `VITE_API_BASE` | 운영 병원 서버 주소 (`https://dxline-tallent.com`) | 등록됨 |
| `TAURI_SIGNING_PRIVATE_KEY` | 자동 업데이트 서명 | 등록됨 |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 위 키의 비밀번호 | 등록됨 |
| `APPLE_CERTIFICATE` 외 5개 | macOS 코드서명·공증 | 등록됨 |

`VITE_API_BASE` 를 지우면 설치 파일이 `http://localhost:4301` 을 바라보게 되므로 건드리지 않는다.
Apple 관련 6개는 아래 "macOS 코드서명·공증" 절 참고.

## 자동 업데이트

v0.1.1 부터 활성화되어 있다. 릴리즈마다 `latest.json` 과 `.sig` 가 함께 올라가고,
앱은 아래 엔드포인트를 본다.

```
https://github.com/dota-pilot1/tuntun-kiosk-chatbot-tauri/releases/latest/download/latest.json
```

저장소가 public 이므로 인증 없이 접근된다. **private 으로 바꾸면 자동 업데이트가 끊긴다.**

서명 키 Secret 은 이미 등록돼 있다.

| Secret | 상태 |
| --- | --- |
| `TAURI_SIGNING_PRIVATE_KEY` | 등록됨 |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 등록됨 |
| `VITE_API_BASE` | 등록됨 |

키를 새로 만들어야 할 때만 아래를 쓴다. **개인키는 절대 저장소에 커밋하지 않는다.**

```bash
npm run tauri signer generate -- -w ~/.tauri/tuntun-kiosk.key
```

공개키는 `src-tauri/tauri.conf.json` 의 `plugins.updater.pubkey` 에 넣고,
개인키 파일과 비밀번호는 GitHub Secret 으로 등록한다.

## macOS 코드서명 · 공증

현재 macOS 산출물은 **미서명**이다. 첫 실행 시 Gatekeeper 경고가 뜬다.
병원 PC 가 Windows 우선이므로 당장 운영에는 지장이 없다.

### 왜 지금은 꺼 두었나

인증서 없이 워크플로가 `APPLE_*` 를 빈 값으로 넘기면 tauri-action 이 서명을
시도하다 실패한다. v0.1.0 의 macOS 잡이 이 이유로 죽었다.

```
failed codesign application: failed to run command security import:
failed to import keychain certificate
```

그래서 `.github/workflows/tauri-release.yml` 의 `APPLE_*` 6줄을 주석 처리해 두었다.

### 켜는 절차

`dota-pilot1` 계정은 다른 Tauri 앱(`tc-dx-mybatis` 등)에서 쓰는
Developer ID 인증서를 이미 보유하고 있다. 같은 인증서를 재사용한다.

1. 워크플로의 `APPLE_*` 6줄 주석을 푼다.
2. Secret 6개를 등록한다. **파일 내용을 화면에 출력하지 말고 파이프로 넘긴다.**

```bash
REPO="dota-pilot1/tuntun-kiosk-chatbot-tauri"
SECRETS_DIR="/Users/terecal/english-agent-hub-container/배포 가이드/.local-secrets"

gh secret set APPLE_CERTIFICATE --repo "$REPO" \
  < "$SECRETS_DIR/apple_certificate_base64.txt"
gh secret set APPLE_CERTIFICATE_PASSWORD --repo "$REPO" \
  < "$SECRETS_DIR/apple_certificate_password.txt"
gh secret set APPLE_ID --repo "$REPO" \
  < "$SECRETS_DIR/apple_id.txt"
gh secret set APPLE_PASSWORD --repo "$REPO" \
  < "$SECRETS_DIR/apple_app_specific_password.txt"

printf '%s' 'Developer ID Application: Hyunseok oh (5PRM3RRTSH)' \
  | gh secret set APPLE_SIGNING_IDENTITY --repo "$REPO"
printf '%s' '5PRM3RRTSH' \
  | gh secret set APPLE_TEAM_ID --repo "$REPO"

gh secret list --repo "$REPO"
```

3. 새 태그를 푸시해 빌드한다.
4. macOS 잡 로그에 `Notarizing Finished with status Accepted` 가 보이면 정상이다.

> 인증서와 비밀번호는 서로 맞는 쌍이어야 한다. 인증서는 Base64 형식으로 등록한다.

### 문제 해결

| 증상 | 원인 |
| --- | --- |
| `failed to import keychain certificate` | `APPLE_*` 가 빈 값이거나 인증서/비밀번호 불일치 |
| `SecKeychainItemImport` 실패 | Base64 인코딩 형식 또는 인증서 비밀번호 확인 |
| 공증 단계 실패 | Apple ID, 앱 전용 비밀번호, Team ID, 서명 identity 확인 |
| 설치 파일명이 `_0.1.0_...` 처럼 비어 나옴 | `productName` 이 비ASCII. ASCII 로 둔다 |

## 병원 PC 설치 정책

계획서 §16 에 따라 자동 설치가 아니라 **새 버전 알림 후 직원 승인 설치**를 기본으로 한다.
