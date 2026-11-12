/* ============================================================
   조리하기 데이터  (직접 확인·수정하는 파일)
   ------------------------------------------------------------
   요리를 제출하면 '조리하기' 화면에서 한 단계씩 미니게임을 해요.
   창작 요리는 아래 규칙으로 학생이 담은 재료를 보고 단계를 자동으로 만들어요.

   ★ 단계 순서 : 썰기 → 달걀 깨기 → 붓기 → 조리(끓이기·볶기 등)
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
  whip:    { name: '거품 내기', desc: '빙글빙글 저어 거품을 내요' },
  knead:   { name: '반죽하기',  desc: '꾹꾹 눌러 매끈하게 반죽해요' },
  chill:   { name: '굳히기',    desc: '알맞은 시간만큼 차갑게 굳혀요' }
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
/* 달걀 깨기 미니게임 설정
   gramsEach : 한 개의 무게(g) → 개수 = 양 ÷ 무게 (1~maxCount개)
   period    : 힘 표시가 한 번 왕복하는 시간(초). 달걀이 하나씩 늘 때마다 speedUp 만큼 빨라짐
   perfect   : 초록 칸 너비(%),  good : 노란 칸까지 너비(%) */
const GG_CRACK = { gramsEach: { egg: 50, yolk: 18 }, maxCount: 6, period: 1.6, speedUp: 0.1, perfect: 16, good: 40 };

/* 붓기: 물·육수 분류와 아래 재료. 이 양(mL)보다 적으면 붓기 게임 없이 양념처럼 넣어요 */
const GG_POUR_IDS = ['milk', 'cream', 'coconut'];
const GG_POUR_MIN = 30;
/* 붓기 미니게임 설정
   seconds : 목표량까지 붓는 데 걸리는 시간(초). 작을수록 빨리 차올라서 어려워요
   perfect : 이 % 안으로 맞추면 100점,  zero : 이 % 이상 틀리면 0점
   color   : 액체 색 (water 물 / broth 육수 / milk 하얀 액체) */
const GG_POUR = { seconds: 3.5, perfect: 3, zero: 30 };
const GG_POUR_COLOR = { water: 'water', broth: 'broth', milk: 'milk', cream: 'milk', coconut: 'milk' };

/* 끓이기 미니게임 설정
   불 세기(0~100)를 초록 칸(zone) 안에 유지하면 끓임 막대가 차요
   필요한 시간(초) = baseSec + 물·육수 1L마다 perLiter초  (maxSec까지)
   rise : 버튼을 누를 때 1초에 오르는 불 세기,  fall : 손을 떼면 1초에 내려가는 불 세기
   over : 이 값보다 세면 넘쳐요 (감점) */
const GG_BOIL = { zone: [45, 72], over: 88, baseSec: 5, perLiter: 4, maxSec: 12, rise: 55, fall: 22 };

/* 볶기 미니게임 설정
   팬을 좌우로 흔든 횟수가 필요한 만큼 차면 완성
   필요한 횟수 = 재료 무게(g) ÷ gramsPerToss  (minToss~maxToss)
   burnPerSec : 가만히 두면 1초에 타는 정도(100이 되면 탐),  coolPerToss : 한 번 흔들 때 줄어드는 정도 */
const GG_STIRFRY = { gramsPerToss: 40, minToss: 8, maxToss: 18, burnPerSec: 30, coolPerToss: 22 };

/* 굽기 미니게임 설정
   익힘(0~100)이 secToBurn 초 만에 끝까지 올라요. 노릇노릇 칸(zone)에서 [뒤집기]를 누르면 성공
   sides : 몇 면을 굽는지 (2 = 앞뒤) */
const GG_GRILL = { secToBurn: 4.5, zone: [58, 80], sides: 2 };

/* 튀기기 미니게임 설정
   1) 기름 온도가 low~high ℃ 사이를 sweepSec 초에 한 번씩 오르내려요. best 칸에서 [넣기]
   2) 튀김 색(0~100)이 secToBurn 초 만에 끝까지 가요. 노릇 칸(zone)에서 [건지기] */
const GG_FRY = { low: 120, high: 220, sweepSec: 3, best: [170, 180], ok: [160, 190], secToBurn: 4, zone: [58, 80] };

/* 버무리기 미니게임 설정
   손가락으로 그릇 안을 동그랗게 돌려요. 돌릴 바퀴 수 = 재료 무게(g) ÷ gramsPerTurn  (minTurns~maxTurns) */
const GG_TOSS = { gramsPerTurn: 120, minTurns: 3, maxTurns: 7, secPerTurn: 2.2, extraSec: 5 };

/* 거품 내기 미니게임 설정
   손가락으로 빙글빙글 돌린 바퀴 수에 따라 거품 상태가 변해요
   peak : 이 바퀴 수 사이면 '뿔이 섰어요!' (성공),  butter : 이 바퀴 수를 넘으면 버터가 돼 버려요 */
const GG_WHIP = { peak: [6, 8], butter: 10, limitSec: 15 };

/* 반죽하기 미니게임 설정
   손가락으로 반죽을 아래로 꾹 밀 때마다 1번. 필요한 횟수 = 가루 무게(g) ÷ gramsPerPush  (minPush~maxPush) */
const GG_KNEAD = { gramsPerPush: 20, minPush: 6, maxPush: 14, secPerPush: 0.9, extraSec: 5 };

/* 굳히기 미니게임 설정
   냉장고 안 시간이 1초에 minPerSec 분씩 흘러요. 목표 시간(분)에 [꺼내기]
   레시피에서 chillMin 으로 목표 시간을 정할 수 있어요 (없으면 defaultMin) */
const GG_CHILL = { defaultMin: 120, minPerSec: 30, perfect: 10, zero: 60 };

/* 요리 종류별 기본 조리 방법 (창작 요리에서 학생이 고르기 전까지 쓰는 값) */
const GG_DEFAULT_METHOD = {
  soup: 'boil',
  stirfry: 'stirfry',
  salad: 'toss',
  noodle: 'boil',
  dessert: 'whip'
};

/* ============================================================
   창작 요리: 조리 방법 고르기
   ------------------------------------------------------------
   학생이 고를 수 있는 조리 방법 (이 순서대로 버튼이 나와요) */
const GG_METHODS = ['boil', 'stirfry', 'grill', 'fry', 'toss', 'whip', 'knead', 'chill'];

/* 요리 종류별로 어울리는 조리 방법
   good : 딱 맞아요 (100%),  ok : 괜찮아요 (75%),  나머지는 어색해요 (30%) */
const GG_METHOD_FIT = {
  soup:    { good: ['boil'],                      ok: [] },
  stirfry: { good: ['stirfry'],                   ok: ['grill', 'fry'] },
  salad:   { good: ['toss'],                      ok: ['grill'] },
  noodle:  { good: ['boil'],                      ok: ['stirfry'] },
  dessert: { good: ['whip', 'chill', 'knead', 'grill'], ok: ['boil', 'fry', 'toss'] }
};

/* 재료를 보고 꼭 지켜야 하는 규칙 (어기면 penalty 만큼 깎여요. 없으면 30%)
   ids    : 이 재료가 들어 있으면,  need : 이 조리 방법 중 하나를 골라야 해요
   key 가 raw 인 규칙을 어기면 셰프들이 특히 크게 혼내요 */
const GG_METHOD_RULES = [
  { key: 'raw', ids: ['beef', 'pork', 'chicken', 'mincedmeat', 'bacon', 'shrimp', 'snail', 'egg', 'yolk'],
    need: ['boil', 'stirfry', 'grill', 'fry'], penalty: 0.6, msg: '날고기·날달걀·해산물은 꼭 불로 익혀야 해요' },
  { key: 'dry', ids: ['spaghetti', 'ricenoodle', 'glass', 'macaroni', 'lentil', 'redbean'],
    need: ['boil'], msg: '마른 면과 마른 콩은 물에 삶아야 먹을 수 있어요' },
  { key: 'gel', ids: ['gelatin'],
    need: ['chill'], msg: '젤라틴을 넣었으면 차갑게 굳혀야 해요' }
];

/* 힌트를 보면 조리 방법 점수가 이만큼만 남아요 (0.8 = 80%) */
const GG_HINT_KEEP = 0.8;

