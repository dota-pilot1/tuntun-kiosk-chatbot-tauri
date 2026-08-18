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

지금 상태로도 **서명 없이** 빌드·배포됩니다. 아래는 선택 사항입니다.

| Secret | 용도 | 없으면 |
| --- | --- | --- |
| `VITE_API_BASE` | 운영 병원 서버 주소 | `http://localhost:4301` 로 빌드됨 |
| `TAURI_SIGNING_PRIVATE_KEY` | 자동 업데이트 서명 | 자동 업데이트 비활성 |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 위 키의 비밀번호 | 〃 |
| `APPLE_CERTIFICATE` 외 5개 | macOS 코드서명·공증 | 미서명 `.dmg` (첫 실행 시 경고) |

> `VITE_API_BASE` 를 등록하지 않으면 설치 파일이 localhost 를 바라봅니다.
> 실제 배포 전에 반드시 등록하세요.

## 자동 업데이트 켜기 (선택)

계획서 §16 의 updater 흐름을 쓰려면 전용 서명 키가 필요합니다.
**개인키는 절대 저장소에 커밋하지 마세요.**

```bash
npm run tauri signer generate -- -w ~/.tauri/tuntun-kiosk.key
```

1. 출력된 **공개키**를 `src-tauri/tauri.conf.json` 의 `plugins.updater.pubkey` 에 넣습니다.
2. **개인키 파일 내용**을 GitHub Secret `TAURI_SIGNING_PRIVATE_KEY` 로,
   생성 시 입력한 비밀번호를 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` 로 등록합니다.
3. `src-tauri/tauri.conf.json` 에 다음을 추가합니다.

```jsonc
{
  "bundle": { "createUpdaterArtifacts": true },
  "plugins": {
    "updater": {
      "pubkey": "<위에서 얻은 공개키>",
      "endpoints": [
        "https://github.com/dota-pilot1/tuntun-kiosk-chatbot-tauri/releases/latest/download/latest.json"
      ]
    }
  }
}
```

4. `src-tauri/Cargo.toml` 에 `tauri-plugin-updater = "2"`, `tauri-plugin-process = "2"` 를 추가하고
   `lib.rs` 에서 플러그인을 등록합니다.

> 저장소가 private 이면 updater 엔드포인트에 인증이 필요합니다.
> 사내 배포만 할 경우 릴리즈 저장소를 public 으로 두거나 별도 배포 서버를 검토하세요.

## 병원 PC 설치 정책

계획서 §16 에 따라 자동 설치가 아니라 **새 버전 알림 후 직원 승인 설치**를 기본으로 합니다.
