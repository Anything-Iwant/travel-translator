# 여행 대화 번역기 — 홈 화면 설치 안내 버튼 포함

## GitHub 저장소 업데이트

1. ZIP 파일을 다운로드하고 압축을 풉니다.
2. https://github.com/Anything-Iwant/travel-translator 를 엽니다.
3. `Add file` → `Upload files`를 누릅니다.
4. 압축을 푼 폴더 안의 `index.html`, `style.css`, `app.js`, `manifest.json`, `README_KO.md`와 `icons` 폴더를 저장소 최상위에 업로드합니다. 기존 파일은 교체해도 됩니다.
5. 아래 `Commit changes`를 눌러 저장합니다.
6. GitHub Pages가 다시 배포될 때까지 잠시 기다린 뒤 https://anything-iwant.github.io/travel-translator/ 를 엽니다.

## 변경 내용
- 메인 화면에 **바탕화면 바로가기 설치** 버튼 추가
- 설치 가능한 브라우저에서는 설치 팝업을 요청
- 지원하지 않는 경우 브라우저 메뉴에서 홈 화면 추가하는 방법 안내
- PWA manifest 및 192px/512px 아이콘 추가
- 말하기, 번역, 번역읽기, 언어 전환, 번역 기록 포함

## 참고
웹사이트가 사용자의 승인 없이 홈 화면 아이콘을 자동 생성하는 것은 브라우저 보안상 허용되지 않습니다. 버튼은 지원되는 브라우저에서는 설치 요청을 표시하고, 그 외에는 '홈 화면에 추가' 메뉴를 안내합니다. 설치 기능은 브라우저/기기별로 다를 수 있습니다. 번역에는 인터넷과 MyMemory 공개 번역 API가 필요하며, 음성 기능은 브라우저에 따라 다릅니다.
