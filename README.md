# 완등 한 컷

[웹페이지 열기](https://choeziwon.github.io/climbing-thumbnail-site/)

한컷체 폰트와 다양한 도형으로 클라이밍 썸네일을 만드는 정적 웹페이지입니다. 이미지는 브라우저 안에서 처리되며 서버로 업로드되지 않습니다.

이 저장소에는 공개 배포에 필요한 HTML·JavaScript·CSS와 폰트 파일만 포함됩니다. 추가 폰트의 라이선스는 HTML의 fontLicenses 항목에 포함되어 있습니다.

## 모바일 / 데스크톱 분리

- [데스크톱 버전](https://choeziwon.github.io/climbing-thumbnail-site/desktop/) — `desktop/index.html`
- [모바일 버전](https://choeziwon.github.io/climbing-thumbnail-site/mobile/) — `mobile/index.html`, `mobile/editor.css`, `mobile/editor.js`
- 공통 편집·저장 기능 및 스타일 — `shared/`
- 공통 폰트·공유 이미지 — `assets/`

기존 루트 주소는 처음 접속할 때 화면 너비가 1080px 미만이면 모바일로, 그 외에는 데스크톱으로 연결됩니다. 직접 주소는 화면 너비와 관계없이 해당 버전을 유지합니다. 데스크톱은 모바일 전용 코드를 로드하지 않습니다. 공유용 OG 및 canonical 주소는 기존 루트를 유지합니다.

## 웹 폰트 파일 이름

`assets/`의 파일명은 실제 폰트 이름으로 관리합니다. 한컷체 웹용은 `OneKut-Web.ttf`이며, 나머지는 `NotoSansKR.woff`, `NanumGothic.woff`, `GothicA1.woff`, `BlackHanSans.woff`, `Jua.woff`, `NanumMyeongjo.woff`, `NotoSerifKR.woff`, `Hahmlet.woff`, `GowunBatang.woff`, `SongMyung.woff`입니다. CSS URL의 `?v=` 값으로 폰트 변경 시 캐시를 갱신합니다.

설치용 파일과 이용 조건: [한컷체 다운로드](https://github.com/choeziwon/climbing-thumbnail-site/releases/tag/font-v1.0.3). 제작자는 **원이네 스튜디오**이며 개인·기업의 상업적 이용까지 무료인 **한컷체 · OneKut 무료 이용 라이선스 1.0**을 적용합니다.

현재 1.003 배포본은 앱·웹 임베딩과 상업적 이용을 무료로 허용합니다. 폰트 수정·별도 재배포·폰트 자체 판매는 사전 허락이 필요합니다. [전체 라이선스](https://choeziwon.github.io/climbing-thumbnail-site/assets/OneKut-LICENSE.txt)를 확인하세요. 이전 OFL 배포본의 권한은 유지되며 이번 변경이 소급 적용되지 않습니다.
