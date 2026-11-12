/* ============================================================
   조리하기 데이터  (직접 확인·수정하는 파일)
   ------------------------------------------------------------
   요리를 제출하면 '조리하기' 화면에서 한 단계씩 미니게임을 해요.
   창작 요리는 아래 규칙으로 학생이 담은 재료를 보고 단계를 자동으로 만들어요.

   ★ 단계 순서 : 썰기 → 달걀 깨기 → 붓기 → 조리(끓이기·볶기 등) → 양념 넣기 → 담기
   ============================================================ */

/* 미니게임 종류 (이름과 짧은 설명) */
const GG_COOK_GAMES = {
  chop:    { name: '썰기',      desc: '재료를 먹기 좋게 썰어요' },
  crack:   { name: '달걀 깨기', desc: '달걀을 톡 깨서 넣어요' },
  pour:    { name: '붓기',      desc: '눈금에 맞춰 정확히 부어요' },
  boil:    { name: '끓이기',    desc: '불 세기를 알맞게 맞춰 끓여요' },
  stirfry: { name: '볶기',      desc: '팬을 흔들어 타지 않게 볶아요' },
  grill:   { name: '굽기',      desc: '노릇노릇할 때 뒤집어요' },
  fry:     { name: '튀기기',    desc: '기름 온도를 맞춰 튀겨요' },
  toss:    { name: '버무리기',  desc: '골고루 섞어요' },
  season:  { name: '양념 넣기', desc: '양념을 넣어요' },
  plate:   { name: '담기',      desc: '그릇에 예쁘게 담아요' }
};

/* 썰기: 이 분류의 재료는 썰어요 */
const GG_CHOP_CATS = ['veg', 'meat', 'sea'];
/* 분류와 상관없이 썰어야 하는 재료 id */
const GG_CHOP_IDS = ['tofu', 'ricecake', 'baguette', 'tortilla', 'mozzarella', 'cheddar', 'chocolate', 'creamcheese'];
/* 썰 필요가 없는 재료 id (위 분류에 들어 있어도 빼요) */
const GG_NO_CHOP_IDS = ['beansprout', 'corn', 'blueberry', 'olive', 'seaweed', 'gim', 'anchovy', 'snail', 'lime'];

/* 썰기 미니게임 설정
   칼질 횟수 = 재료 무게(g) ÷ gramsPerCut  (minCuts~maxCuts 사이로 맞춤)
   제한 시간 = 전체 칼질 횟수 × secPerCut + extraSec (초) */
const GG_CHOP = { gramsPerCut: 25, minCuts: 3, maxCuts: 10, secPerCut: 0.8, extraSec: 4 };

/* 달걀 깨기 */
const GG_CRACK_IDS = ['egg', 'yolk'];

/* 붓기: 물·육수 분류와 아래 재료. 이 양(mL)보다 적으면 붓기 게임 없이 양념처럼 넣어요 */
const GG_POUR_IDS = ['milk', 'cream', 'coconut'];
const GG_POUR_MIN = 30;

/* 요리 종류별 기본 조리 방법 (창작 요리에서 학생이 고르기 전까지 쓰는 값) */
const GG_DEFAULT_METHOD = {
  soup: 'boil',
  stirfry: 'stirfry',
  salad: 'toss',
  noodle: 'boil'
};
