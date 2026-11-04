/* ============================================================
   심사 규칙 데이터  (직접 확인·수정하는 파일)
   ------------------------------------------------------------
   ★ 숫자는 모두 "전체 재료 무게(물·육수 포함)에 대한 %" 입니다.  [최소, 최대] 순서.
   ★ 아래 알맞은 범위는 집밥 기준의 대략적인 값이니, 교사가 직접 검토해서 고쳐 주세요.
   ============================================================ */

/* 요리 종류별 알맞은 범위
   salt  : 소금 비율(간장, 된장 등은 소금으로 환산해서 합침)
   sugar : 설탕(단맛) 비율          oil : 기름 비율
   water : 물·육수 비율              main : 주재료(가장 많은 재료)가 '건더기' 중에서 차지하는 비율 */
const GG_DISH_TYPES = [
  { id: 'soup',    name: '국·찌개', desc: '국물이 있는 따뜻한 요리',   emoji: '🍲',
    salt: [0.6, 1.1], sugar: [0, 1.5], oil: [0, 3],  water: [45, 85], main: [15, 50] },
  { id: 'stirfry', name: '볶음',    desc: '기름에 볶아 만드는 요리',   emoji: '🍳',
    salt: [0.9, 1.8], sugar: [0, 4],   oil: [2, 8],  water: [0, 20],  main: [25, 65] },
  { id: 'salad',   name: '샐러드',  desc: '신선하게 버무린 요리', emoji: '🥗',
    salt: [0.3, 1.0], sugar: [0, 3],   oil: [3, 10], water: [0, 10],  main: [20, 60] },
  { id: 'noodle',  name: '면',      desc: '면이 주인공인 요리',        emoji: '🍜',
    salt: [0.8, 1.4], sugar: [0, 3.5], oil: [0, 8],  water: [0, 65],  main: [25, 85] }
];

/* 종류와 상관없이 쓰는 범위 */
const GG_COMMON_RANGES = {
  variety: [4, 10],        // 재료 가짓수 (물·육수 제외)
  amount:  [300, 2500]     // 전체 무게(g)
};

/* 면 요리에 꼭 필요한 면 재료 (재료 id) */
const GG_NOODLE_IDS = ['udon', 'spaghetti', 'ricenoodle', 'glass', 'macaroni'];

/* 이상한 조합 규칙
   pair    : a 목록 중 하나와 b 목록 중 하나가 함께 들어가면 걸림 (재료 id)
   countOf : any 목록의 재료가 atLeast 가지 이상 들어가면 걸림
   없는 재료 id가 들어 있어도 괜찮아요. 나중에 그 재료를 추가하면 자동으로 작동합니다. */
const GG_COMBO_RULES = [
  { id: 'seafood-milk', pair: { a: ['anchovy', 'shrimp', 'tuna', 'fishcake', 'seaweed'], b: ['milk'] },
    msg: '해산물과 우유는 비린 맛이 날 수 있어요' },
  { id: 'jang-dairy',   pair: { a: ['doenjang', 'miso'], b: ['milk', 'cheddar', 'mozzarella', 'butter'] },
    msg: '된장 맛과 우유·치즈는 서로 어울리기 어려워요' },
  { id: 'vinegar-milk', pair: { a: ['vinegar'], b: ['milk'] },
    msg: '식초와 우유를 섞으면 몽글몽글 덩어리가 져요' },
  { id: 'many-jang',    countOf: { any: ['doenjang', 'gochujang', 'miso', 'doubanjiang'], atLeast: 3 },
    msg: '장 종류가 너무 많이 들어갔어요' },
  { id: 'choco-fish',   pair: { a: ['chocolate'], b: ['anchovy', 'tuna', 'fishcake', 'shrimp'] },
    msg: '초콜릿과 생선은 맛이 너무 달라요' }   // 초콜릿 재료를 추가하면 자동으로 작동
];

/* 요리 이름에 쓰면 안 되는 말 (띄어쓰기, 기호, 숫자를 섞어 써도 걸러집니다. 계속 추가하세요) */
const GG_BANNED_WORDS = [
  '시발', '씨발', '씨바', '시바', 'ㅅㅂ', 'ㅆㅂ', '병신', 'ㅂㅅ', '지랄', 'ㅈㄹ', '좆', '존나', '개새끼', '새끼', '미친', 'ㅁㅊ',
  '꺼져', '죽어', '죽여', '자살', '섹스', '야동', '보지', '자지', '걸레', '찐따', '장애인', '못생', '뚱뚱', '멍청', '바보',
  'fuck', 'shit', 'bitch', 'sex', 'dick'
];

/* 해피 셰프의 창의성 점수에서 "특별한 재료"로 세는 재료 (재료 id) */
const GG_RARE_IDS = ['lemongrass', 'avocado', 'olive', 'coconut', 'turmeric', 'cumin', 'basil', 'fishsauce', 'doubanjiang', 'miso', 'lime', 'curry', 'peanut', 'shiitake'];

/* 요리 이름에 들어 있으면 해피 셰프가 좋아하는 말 (계속 추가하세요) */
const GG_NAME_WORDS = ['마법', '특제', '황금', '우리', '엄마', '아빠', '최강', '달콤', '매콤', '시원', '따끈', '든든', '꿀', '행복', '비밀', '슈퍼', '전설', '향긋', '고소', '새콤', '짭짤', '세계', '무지개', '보물'];

/* 총점에 따른 등급과 한마디 (높은 점수부터) */
const GG_GRADES = [
  { min: 90, title: '별 셋 요리사',     msg: '심사위원들이 박수를 쳤어요! 정말 훌륭한 요리예요.' },
  { min: 75, title: '실력 있는 요리사', msg: '맛있는 요리예요! 조금만 더 다듬으면 최고가 될 거예요.' },
  { min: 55, title: '성장하는 요리사', msg: '좋은 시작이에요. 숫자를 보며 비율을 조금씩 바꿔 봐요.' },
  { min: 0,  title: '도전하는 요리사', msg: '실패는 맛있는 요리의 재료예요. 다시 도전해 봐요!' }
];
