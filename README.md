# MANDATUM

MANDATUM 세계관을 소개하는 인터랙티브 웹사이트입니다.

## Vercel 배포

이 저장소를 Vercel 프로젝트에 연결하면 `main` 브랜치의 변경 사항이 자동으로 빌드되고 배포됩니다.

1. Vercel에서 **Add New → Project**를 선택합니다.
2. GitHub의 `sangha0712/MANDATUM-` 저장소를 가져옵니다.
3. Framework Preset은 **Vite**로 선택합니다.
4. 별도의 명령어를 입력하지 않고 **Deploy**를 누릅니다.

저장소의 `vercel.json`에 설치, 빌드, 결과물 경로와 SPA 주소 처리가 설정되어 있습니다. `/world`, `/characters`, `/webtoon`, `/archive` 주소를 직접 열거나 새로고침해도 첫 화면으로 잘못 이동하지 않습니다.

## 로컬 실행

```bash
bun ci
bun run dev
```

프로덕션 빌드는 다음 명령으로 확인할 수 있습니다.

```bash
bun run build
```

## 이미지 호스팅 참고

캐릭터와 웹툰의 고해상도 이미지는 `igx.kr` 주소에서 불러옵니다. 해당 외부 이미지 서버가 중단되거나 주소 정책이 바뀌면 Vercel 사이트에서도 관련 이미지가 보이지 않을 수 있습니다.
