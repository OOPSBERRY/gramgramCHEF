# 그램그램 셰프

초등 5학년 수업용 태블릿(가로 화면) 요리 웹게임. 재료의 양(g, mL)을 정하고 요리를 만들어 제출하면 셰프 캐릭터들이 비율로 점수를 매긴다. 성인도 재밌게 할 수 있어야 한다.

## 반드시 지킬 조건
- `index.html`만 열면 돌아가야 한다. 프레임워크, 서버, 외부 API, AI API, 외부 CDN을 쓰지 않는다 (비용 0원).
- 재료, 레시피, 셰프 대사 같은 데이터는 코드와 분리해 `data/*.js`에 둔다. (file://에서는 .json 불러오기가 막혀서 `const 이름 = [...]` 형태의 .js로 만든다.)
- 터치 사용이 쉬워야 한다. 버튼은 크게, 값은 슬라이더로 정한다.
- 한 번에 한 단계씩 만든다. 사용자(비개발자 초등교사)는 쉬운 말로 설명해야 한다.

## 디자인 규칙
**모든 화면은 `css/design-rules.css`의 디자인 규칙(CSS 변수)을 따를 것.** 색, 글자 크기, 간격을 직접 숫자나 색 코드로 쓰지 말고 변수를 쓴다.

- **글꼴:** 수성돋움체 (`assets/fonts/`, 굵기 한 종류)
- **색:** 메인 주황 `--c-main`, 보조 초록 `--c-green`, 금색 `--c-gold`, 어두운 배경 `--c-dark`, 밝은 배경 크림 `--c-cream`, 글자 `--c-ink` / `--c-on-dark`, 경고 `--c-danger`
- **글자 크기:** 제목 40 / 소제목 26 / 본문 20 / 작은 글씨 16px (16px 미만 금지)
- **간격:** 8px 단위 (8, 16, 24, 32)
- **버튼:** 둥근 알약 모양, 높이 56px 이상, 주요 버튼은 주황으로 꽉 채움
- **카드:** 모서리 20px, 유리 카드는 배경을 흐리게 비춤
- **그림자:** 떠 있는 사진(후라이팬, 요리 접시)과 버튼 눌림에만 사용
- **피할 것:** 보라색 그라데이션, 이모지 아이콘 남발(사진이 있으면 사진 사용, 분류 탭은 글자만), 모든 곳에 그림자
- **화면별 분위기:** 첫 화면과 요리 화면은 어두운 톤, 결과 화면은 밝은 크림 톤. 사진은 실사 위주.

## 사진 (assets/)
- `assets/ingredients/` 재료(투명 PNG, 파일명은 재료 id), `assets/dishes/` 완성 요리, `assets/ui/` 후라이팬과 첫 화면 배경. 목록: `assets/사진목록.md`
- 사진 파일이 없으면 이모지로 대신 보여서 앱이 깨지지 않게 한다.

## 진행 단계
1단계 기본 뼈대, 재료, 양 정하기, 가격 (완료) / 2단계 창작 모드와 비율 심사, 버럭 셰프 (완료) / 3단계 실제 요리 도전 (완료) / 4단계 개인전 랭킹과 모둠전 (완료) / 5단계 나머지 셰프 3명과 합산 연출 (완료) / 6단계 다듬기 (완료)
- 별도 작업: 오프닝, 홈, 요리, 제출, 결과, 요리 고르기 화면 디자인 적용 완료. 심사 규칙 data/rules.js, 셰프와 대사 data/chefs.js (ready: true 인 셰프만 합산, 100점으로 자동 환산), 실제 요리 레시피 data/recipes.js (재료와 양은 2인분 기준 g/mL, 비율은 자동 계산, 유사도 = 필수 재료 40% + 비율 일치 45% + 관계없는 재료 15%).
- 랭킹·개인전/모둠전·참가자 이름 입력·점수 기록 저장은 단순하게 하려고 2026-11-10에 모두 없앰. 요리 버튼을 누르면 바로 요리를 시작하고, 점수는 결과 화면에서만 보여 준다. (예전 코드는 git 기록에 남아 있음)
- 셰프 4명(버럭·깐깐·그램·해피) 모두 ready: true. 새 심사 항목: price(가격·예산), accuracy(계산 확인: 제출 전 총 원가·총 무게를 직접 계산해 입력, 도우미 사용 시 최대 절반), creative·nameq·brave(해피). 계산 확인 화면은 css/calc.css. 대사의 {dish} 뒤 조사(가/이, 를/을 등)는 요리 이름 받침에 맞춰 자동 수정됨.
- 6단계 다듬기: 후라이팬 속 재료 크기가 양에 따라 변함(app.js setSlotSize), 효과음은 파일 없이 WebAudio로 생성(js/sound.js, 기본 꺼짐, localStorage 키 gramgram_sound_v1), 화면 전환·버튼 누름·점수 75점 이상 색종이 효과는 css/polish.css, 입력칸이 키보드에 가려지지 않게 focusin 때 가운데로 스크롤.
- QR 코드: js/qr.js(외부 라이브러리 없이 QR 생성, 검증 완료), js/share.js(버튼·팝업, 첫 화면과 홈에 버튼), data/share.js(GG_SHARE_URL 비우면 현재 주소 자동 사용).
- 링크 미리보기: index.html 의 og:* 메타 태그, 이미지는 assets/ui/og.jpg (배포 주소 https://gramgramchef.netlify.app/).
- 디저트·베이킹 분류(sweet) 추가: 재료 23개 + 블루베리·망고(채소·과일). sweet 재료의 설탕도 단맛 계산에 포함(js/judge.js). 가격·설탕 값은 대략 추정치라 교사 검토 필요.
- 조리하기(2026-11-12~): 제출 → 조리하기(screen-cook) → 계산 확인 → 심사. js/cook.js(단계 자동 생성, 공통 화면 ui.intro/timer/feedback/buzz, 창작 요리 조리 방법 고르기·힌트·평가), 미니게임 js/cook-chop·pour·crack·heat(끓이기·볶기)·more(굽기·튀기기·버무리기)·dessert(거품·반죽·굳히기).js, 설정·규칙은 data/cooking.js, 스타일 css/cook.css. 진동은 navigator.vibrate(안드로이드만).
- 요리 종류에 디저트(dessert) 추가: data/rules.js, 단맛 범위 넓고 sweet:999, 고기·해산물은 어색함(GG_DESSERT_ODD_CATS).
- 레시피의 cook 필드 = 조리 순서(실제 요리는 고르기 없이 이 순서대로). 디저트 레시피 9개(patbingsu, hotteok, pancake, brownie, crepe, pannacotta, mango-lassi, churros, sutlac) + 재료 얼음(ice). 요리 고르기에 '디저트' 필터.
- 조리 점수: judge.js 의 metrics.cook(미니게임 평균), metrics.method(창작 요리만, 힌트 시 80%, 날고기 미조리 감점 0.6). 셰프 focus: 버럭 method·cook, 깐깐 method, 해피 cook. 조리 대사는 data/chefs.js 맨 아래 GG_COOK_LINES (rawFood, methodWrong, hintUsed, cookGreat, cookClumsy).
- 남은 일: 디저트 완성 사진 9장, 얼음 재료 사진, 창작 요리 대표 접시 5장.
