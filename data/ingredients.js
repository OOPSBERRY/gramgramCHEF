/* ============================================================
   재료 데이터  (직접 추가·수정하는 파일)
   ------------------------------------------------------------
   재료 한 줄 = I( id, 이름, 이모지, 분류, 단위, 100당 가격(원), { 옵션 } )

   - id      : 영어/숫자 (중복 금지). 레시피 데이터에서 이 id로 부릅니다.
   - 분류    : veg meat sea grain dairy season spice oil sauce sweet liquid  (아래 GG_CATEGORIES 참고)
   - 단위    : 'g'  = 무게 재료 (g, kg 로 바꿔 볼 수 있음)
               'mL' = 부피 재료 (mL, L 로 바꿔 볼 수 있음)
   - 가격    : 100g 또는 100mL 당 가격(원)
   - 옵션(모두 생략 가능)
       salt    : 100g 속에 들어있는 소금(g)   → 간 계산에 사용 (2단계)
       sugar   : 100g 속에 들어있는 설탕(g) 환산 → 단맛 계산에 사용 (2단계)
       density : 1mL 의 무게(g). mL 재료를 g 으로 바꿀 때 사용 (기본 1)
       max     : 슬라이더 최댓값,  step : 슬라이더 한 칸,  def : 처음 담을 때 양
       tags    : 이상한 조합 규칙 등에 쓰는 이름표 (2단계)
   ============================================================ */

const GG_CATEGORIES = [
  { id: 'veg',    name: '채소·과일',   emoji: '🥕' },
  { id: 'meat',   name: '고기',        emoji: '🥩' },
  { id: 'sea',    name: '해산물',      emoji: '🦐' },
  { id: 'grain',  name: '곡물·면·콩',  emoji: '🍜' },
  { id: 'dairy',  name: '유제품·달걀', emoji: '🧀' },
  { id: 'season', name: '조미료',      emoji: '🧂' },
  { id: 'spice',  name: '향신료',      emoji: '🌿' },
  { id: 'oil',    name: '기름',        emoji: '🫗' },
  { id: 'sauce',  name: '소스류',      emoji: '🥫' },
  { id: 'sweet',  name: '디저트·베이킹', emoji: '🍰' },
  { id: 'liquid', name: '물·육수',     emoji: '💧' }
];

/* 분류별 기본 슬라이더 설정 (재료에서 따로 정하면 그 값이 우선) */
const GG_CAT_DEFAULTS = {
  veg:    { max: 500,  step: 10, def: 100 },
  meat:   { max: 500,  step: 10, def: 150 },
  sea:    { max: 300,  step: 10, def: 100 },
  grain:  { max: 500,  step: 10, def: 100 },
  dairy:  { max: 500,  step: 10, def: 100 },
  season: { max: 100,  step: 1,  def: 5 },
  spice:  { max: 30,   step: 1,  def: 2 },
  oil:    { max: 100,  step: 1,  def: 10 },
  sauce:  { max: 300,  step: 5,  def: 50 },
  sweet:  { max: 300,  step: 5,  def: 50 },
  liquid: { max: 3000, step: 50, def: 500 }
};

function I(id, name, emoji, cat, unit, price, opt) {
  const d = GG_CAT_DEFAULTS[cat];
  return Object.assign(
    { id, name, emoji, cat, unit, price, salt: 0, sugar: 0, density: 1, tags: [] },
    d, opt || {}
  );
}

const GG_INGREDIENTS = [
  /* ---------- 채소 ---------- */
  I('onion',      '양파',        '🧅', 'veg', 'g', 100, { sugar: 6 }),
  I('scallion',   '대파',        '🌿', 'veg', 'g', 150, { max: 300, def: 30 }),
  I('garlic',     '마늘',        '🧄', 'veg', 'g', 400, { max: 100, step: 5, def: 10 }),
  I('carrot',     '당근',        '🥕', 'veg', 'g', 100, { sugar: 5 }),
  I('potato',     '감자',        '🥔', 'veg', 'g', 100),
  I('kimchi',     '배추김치',    '🌶️', 'veg', 'g', 300, { salt: 2.5 }),
  I('tomato',     '토마토',      '🍅', 'veg', 'g', 250, { sugar: 3 }),
  I('cucumber',   '오이',        '🥒', 'veg', 'g', 150),
  I('cabbage',    '양배추',      '🥬', 'veg', 'g', 100),
  I('zucchini',   '애호박',      '🟢', 'veg', 'g', 200),
  I('spinach',    '시금치',      '🍃', 'veg', 'g', 300),
  I('beansprout', '숙주',        '🌱', 'veg', 'g', 100),
  I('lettuce',    '상추',        '🥗', 'veg', 'g', 400),
  I('mushroom',   '양송이버섯',  '🍄', 'veg', 'g', 600),
  I('avocado',    '아보카도',    '🥑', 'veg', 'g', 700),
  I('lime',       '라임·레몬',   '🍋', 'veg', 'g', 700, { max: 100, step: 5, def: 20 }),
  I('olive',      '올리브',      '🫒', 'veg', 'g', 600, { salt: 3, max: 200 }),
  I('basil',      '바질',        '🌿', 'veg', 'g', 1000, { max: 50, step: 1, def: 5 }),
  I('chili',      '청양고추',    '🔥', 'veg', 'g', 500, { max: 100, step: 5, def: 10 }),
  I('bellpepper', '피망',        '🫑', 'veg', 'g', 400, { max: 300, def: 80 }),
  I('broccoli',   '브로콜리',    '🥦', 'veg', 'g', 300),
  I('corn',       '옥수수',      '🌽', 'veg', 'g', 250, { max: 400 }),
  I('apple',      '사과',        '🍎', 'veg', 'g', 250, { sugar: 0 }),
  I('banana',     '바나나',      '🍌', 'veg', 'g', 200),
  I('strawberry', '딸기',        '🍓', 'veg', 'g', 800),
  I('pineapple',  '파인애플',    '🍍', 'veg', 'g', 400),
  I('parsley',    '파슬리',      '🌿', 'veg', 'g', 1500, { max: 50, step: 1, def: 5 }),
  I('asparagus',  '아스파라거스','🌱', 'veg', 'g', 1500, { max: 300, def: 80 }),
  I('blueberry',  '블루베리',    '🫐', 'veg', 'g', 2500, { max: 300, def: 50 }),
  I('mango',      '망고',        '🥭', 'veg', 'g', 800, { max: 400 }),

  /* ---------- 고기 ---------- */
  I('beef',       '소고기',      '🥩', 'meat', 'g', 2500),
  I('pork',       '돼지고기',    '🐷', 'meat', 'g', 1000),
  I('chicken',    '닭고기',      '🍗', 'meat', 'g', 800),
  I('mincedmeat', '다진 고기',   '🥩', 'meat', 'g', 1200),
  I('bacon',      '베이컨',      '🥓', 'meat', 'g', 2000, { salt: 2.5, max: 300, def: 50 }),
  I('spam',       '스팸',        '🥫', 'meat', 'g', 1500, { salt: 2.3, max: 300, def: 80 }),

  /* ---------- 해산물 ---------- */
  I('shrimp',     '새우',        '🦐', 'sea', 'g', 1500),
  I('tuna',       '참치',        '🐟', 'sea', 'g', 800, { salt: 1 }),
  I('fishcake',   '어묵',        '🍢', 'sea', 'g', 400, { salt: 1.5 }),
  I('anchovy',    '멸치',        '🐠', 'sea', 'g', 1500, { salt: 8, max: 100, step: 5, def: 20 }),
  I('seaweed',    '미역(말린 것)','🌊', 'sea', 'g', 1500, { max: 50, step: 1, def: 5 }),
  I('gim',        '김',          '⬛', 'sea', 'g', 3000, { max: 20, step: 1, def: 2 }),
  I('snail',      '식용 달팽이', '🐌', 'sea', 'g', 4000, { max: 200, def: 50 }),

  /* ---------- 곡물·면·콩 ---------- (면·콩·당면은 '삶기 전' 무게) */
  I('rice',       '밥',          '🍚', 'grain', 'g', 150, { max: 600, def: 200 }),
  I('udon',       '우동면',      '🍜', 'grain', 'g', 250, { def: 200 }),
  I('spaghetti',  '스파게티면(마른 것)', '🍝', 'grain', 'g', 200),
  I('ricenoodle', '쌀국수면(마른 것)',   '🍜', 'grain', 'g', 300),
  I('glass',      '당면(마른 것)',       '🍜', 'grain', 'g', 400),
  I('macaroni',   '마카로니(마른 것)',   '🍝', 'grain', 'g', 200),
  I('ricecake',   '떡볶이떡',    '🍡', 'grain', 'g', 250, { def: 200 }),
  I('tortilla',   '토르티야',    '🌯', 'grain', 'g', 400, { max: 300, def: 80 }),
  I('ricepaper',  '라이스페이퍼','🫓', 'grain', 'g', 800, { max: 100, def: 20 }),
  I('lentil',     '렌틸콩(마른 것)', '🫘', 'grain', 'g', 400, { max: 300 }),
  I('tofu',       '두부',        '⬜', 'grain', 'g', 200, { salt: 0.1 }),
  I('peanut',     '땅콩',        '🥜', 'grain', 'g', 600, { max: 100, step: 5, def: 20 }),
  I('flour',      '밀가루',      '🌾', 'grain', 'g', 100, { max: 200, def: 30 }),
  I('baguette',   '바게트',      '🥖', 'grain', 'g', 350, { max: 200, def: 50 }),
  I('frymix',     '튀김가루',    '🌾', 'grain', 'g', 150, { salt: 1, max: 200, def: 30 }),

  /* ---------- 유제품·달걀 ---------- */
  I('egg',        '달걀',        '🥚', 'dairy', 'g', 450, { max: 400 }),
  I('yolk',       '달걀노른자',  '🟡', 'dairy', 'g', 900, { max: 100, step: 5, def: 20 }),
  I('milk',       '우유',        '🥛', 'dairy', 'mL', 200, { density: 1.03, max: 1000, step: 10, def: 200 }),
  I('butter',     '버터',        '🧈', 'dairy', 'g', 1500, { salt: 1, max: 100, step: 5, def: 20 }),
  I('cheddar',    '체다치즈',    '🧀', 'dairy', 'g', 1200, { salt: 1.8, def: 50 }),
  I('mozzarella', '모짜렐라치즈','🧀', 'dairy', 'g', 1000, { salt: 0.7, def: 80 }),

  /* ---------- 조미료 ---------- */
  I('salt',       '소금',        '🧂', 'season', 'g', 100, { salt: 100, max: 30, step: 1, def: 3 }),
  I('sugar',      '설탕',        '🍬', 'season', 'g', 100, { sugar: 100, max: 50, step: 1, def: 5 }),
  I('brownsugar', '흑설탕',      '🟤', 'season', 'g', 200, { sugar: 95, max: 50, step: 1, def: 5 }),
  I('mulyeot',    '물엿',        '🍯', 'season', 'g', 300, { sugar: 75, max: 100, step: 1, def: 10 }),
  I('soy',        '진간장',      '🫙', 'season', 'mL', 200, { salt: 16, sugar: 2, density: 1.15, max: 100, step: 1, def: 15 }),
  I('gukganjang', '국간장',      '🫙', 'season', 'mL', 400, { salt: 22, density: 1.2, max: 100, step: 1, def: 10 }),
  I('doenjang',   '된장',        '🥣', 'season', 'g', 400, { salt: 12, max: 100, step: 1, def: 20 }),
  I('gochujang',  '고추장',      '🌶️', 'season', 'g', 500, { salt: 7, sugar: 15, max: 100, step: 1, def: 20 }),
  I('miso',       '미소(일본 된장)', '🥣', 'season', 'g', 700, { salt: 11, sugar: 5, max: 100, step: 1, def: 20 }),
  I('gochugaru',  '고춧가루',    '🌶️', 'season', 'g', 900, { max: 50, step: 1, def: 5 }),
  I('mirin',      '맛술',        '🍶', 'season', 'mL', 300, { sugar: 30, density: 1.1, max: 100, step: 1, def: 15 }),
  I('vinegar',    '식초',        '🍶', 'season', 'mL', 150, { density: 1.0, max: 100, step: 1, def: 10 }),
  I('limejuice',  '라임즙',      '🍋', 'season', 'mL', 1000, { max: 100, step: 1, def: 10 }),
  I('lemonjuice', '레몬즙',      '🍋', 'season', 'mL', 800, { max: 100, step: 1, def: 10 }),
  I('chickenstock','치킨 스톡', '🐔', 'season', 'g', 2000, { salt: 45, max: 30, step: 1, def: 5 }),

  /* ---------- 향신료 ---------- */
  I('pepper',     '후추',        '⚫', 'spice', 'g', 2000, { max: 10, step: 1, def: 1 }),
  I('curry',      '카레가루',    '🟡', 'spice', 'g', 1500, { salt: 5, max: 50, step: 1, def: 10 }),
  I('turmeric',   '강황',        '🟠', 'spice', 'g', 3000, { max: 20, step: 1, def: 2 }),
  I('cumin',      '커민',        '🟤', 'spice', 'g', 3000, { max: 20, step: 1, def: 2 }),
  I('lemongrass', '레몬그라스',  '🌾', 'spice', 'g', 1000, { max: 50, step: 1, def: 10 }),
  I('bayleaf',    '월계수 잎',   '🍃', 'spice', 'g', 5000, { max: 5, step: 1, def: 1 }),

  /* ---------- 기름 ---------- */
  I('oil',        '식용유',      '🫗', 'oil', 'mL', 300, { density: 0.92 }),
  I('sesameoil',  '참기름',      '🫗', 'oil', 'mL', 3000, { density: 0.92, max: 50, def: 5 }),
  I('oliveoil',   '올리브유',    '🫒', 'oil', 'mL', 1000, { density: 0.91 }),
  I('chilioil',   '고추기름',    '🌶️', 'oil', 'mL', 1500, { density: 0.92, max: 50, def: 5 }),

  /* ---------- 소스류 ---------- */
  I('tomatosauce','토마토소스',  '🥫', 'sauce', 'g', 300, { salt: 0.8, sugar: 2, def: 100 }),
  I('mayo',       '마요네즈',    '🥚', 'sauce', 'g', 500, { salt: 1.5, sugar: 3, def: 30 }),
  I('fishsauce',  '피시소스',    '🐟', 'sauce', 'mL', 400, { salt: 25, density: 1.2, max: 100, step: 1, def: 10 }),
  I('doubanjiang','두반장',      '🌶️', 'sauce', 'g', 700, { salt: 15, max: 100, step: 1, def: 15 }),
  I('coconut',    '코코넛밀크',  '🥥', 'sauce', 'mL', 500, { density: 1.0, def: 100 }),
  I('salsa',      '살사소스',    '🍅', 'sauce', 'g', 400, { salt: 1, sugar: 2, def: 50 }),
  I('mustard',    '머스타드',    '🟡', 'sauce', 'g', 800, { salt: 3, max: 100, step: 1, def: 10 }),
  I('oystersauce','굴소스',      '🦪', 'sauce', 'g', 800, { salt: 11, sugar: 15, max: 100, step: 1, def: 15 }),
  I('mala',       '마라 소스',   '🌶️', 'sauce', 'g', 1500, { salt: 8, max: 100, step: 1, def: 20 }),

  /* ---------- 디저트·베이킹 ---------- (sugar: 100g 속 설탕 양을 대략 적은 값) */
  I('cream',        '생크림',          '🥛', 'sweet', 'mL', 1000, { sugar: 3, density: 1.0, max: 500, step: 10, def: 100 }),
  I('bakingpowder', '베이킹파우더',    '🥄', 'sweet', 'g', 1500, { max: 20, step: 1, def: 3 }),
  I('bakingsoda',   '베이킹소다',      '🥄', 'sweet', 'g', 800,  { max: 20, step: 1, def: 2 }),
  I('vanilla',      '바닐라 익스트랙트','🍦', 'sweet', 'mL', 15000, { max: 20, step: 1, def: 3 }),
  I('yeast',        '이스트',          '🍞', 'sweet', 'g', 3000, { max: 20, step: 1, def: 5 }),
  I('cornstarch',   '옥수수전분',      '🌽', 'sweet', 'g', 300,  { max: 200, def: 20 }),
  I('creamcheese',  '크림치즈',        '🧀', 'sweet', 'g', 1800, { salt: 0.8, sugar: 3, def: 100 }),
  I('chocolate',    '초콜릿',          '🍫', 'sweet', 'g', 2000, { sugar: 50 }),
  I('cocoa',        '코코아가루',      '🍫', 'sweet', 'g', 2500, { max: 100, step: 1, def: 15 }),
  I('honey',        '꿀',              '🍯', 'sweet', 'g', 2000, { sugar: 80, max: 100, step: 1, def: 15 }),
  I('maple',        '메이플시럽',      '🍁', 'sweet', 'mL', 3000, { sugar: 65, density: 1.32, max: 100, step: 1, def: 15 }),
  I('condensedmilk','연유',            '🥛', 'sweet', 'g', 1000, { sugar: 55, max: 100, step: 1, def: 20 }),
  I('cinnamon',     '시나몬가루',      '🟤', 'sweet', 'g', 4000, { max: 20, step: 1, def: 2 }),
  I('caramel',      '카라멜',          '🍮', 'sweet', 'g', 1500, { salt: 0.5, sugar: 60, max: 100, step: 1, def: 20 }),
  I('redbean',      '팥(마른 것)',     '🫘', 'sweet', 'g', 1000, { def: 100 }),
  I('glutinousflour','찹쌀가루',       '🍡', 'sweet', 'g', 500,  { def: 100 }),
  I('matcha',       '녹차가루',        '🍵', 'sweet', 'g', 6000, { max: 30, step: 1, def: 3 }),
  I('gelatin',      '젤라틴',          '🟨', 'sweet', 'g', 8000, { max: 30, step: 1, def: 5 }),
  I('yogurt',       '요거트',          '🥣', 'sweet', 'g', 500,  { sugar: 4, def: 100 }),
  I('nuts',         '견과류',          '🥜', 'sweet', 'g', 2500, { max: 200, def: 30 }),
  I('raisin',       '건포도',          '🍇', 'sweet', 'g', 1500, { sugar: 60, max: 200, def: 30 }),
  I('marshmallow',  '마시멜로',        '🍬', 'sweet', 'g', 1500, { sugar: 60, max: 200, def: 30 }),
  I('icecream',     '아이스크림',      '🍨', 'sweet', 'g', 800,  { sugar: 20, def: 100 }),

  /* ---------- 물·육수 ---------- */
  I('water',      '물',          '💧', 'liquid', 'mL', 0),
  I('broth',      '육수',        '🍲', 'liquid', 'mL', 50, { salt: 0.2 })
];
