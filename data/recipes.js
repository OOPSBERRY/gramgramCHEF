/* ============================================================
   실제 요리 레시피 데이터  (직접 확인·추가·수정하는 파일)
   ------------------------------------------------------------
   ★ 레시피 한 개의 모양
     { id, name, country, type, sure, intro, note, ranges, sweet,
       ing: [ [재료id, 기준량, {옵션}], ... ] }

     id      : 영어 이름 (사진 파일 이름이기도 해요.  assets/dishes/아이디.png)
     type    : soup(국·찌개) stirfry(볶음) salad(샐러드) noodle(면) dessert(디저트)
     sure    : 레시피 비율에 대한 확신  'high'(보통 이렇게 해요) / 'mid'(집마다 달라요) / 'low'(대략적인 값, 꼭 검토!)
     intro   : 그 나라 음식 문화 한 줄 이야기 (결과 화면에 나와요)
     note    : 교사용 메모 (화면에는 안 나와요)
     ranges  : (선택) 이 요리만 다른 알맞은 범위. 예) { oil: [0, 10], water: [20, 50], main: [30, 85] }
     sweet   : (선택) 단맛÷짠맛 허용 한도 (기본 1.5). 달콤 짭짤한 요리는 크게.
     cook    : 조리 순서 (조리하기 화면에서 이 순서대로 미니게임을 해요)
               boil 끓이기 / stirfry 볶기 / grill 굽기 / fry 튀기기 / toss 버무리기 / whip 거품 내기 / knead 반죽하기
               chill 굳히기는 { game: 'chill', min: 120(분), freeze: true(냉동실) } 처럼 시간을 정할 수 있어요
     ing     : 2인분 기준 재료와 양. 양의 단위는 재료의 단위(g 또는 mL)와 같아요.
        옵션 { opt: true }            있으면 좋은 재료 (없어도 감점 없음, 넣어도 감점 없음)
        옵션 { alt: ['pork','chicken'] }  대신 써도 되는 재료 (예: 소고기 대신 돼지고기)
        옵션 { tol: [0.3, 2.5] }      허용 범위를 직접 지정 (기준 비율의 몇 배~몇 배). 기본은 0.5~1.8배

   ★ 채점 방식 (실제 요리와 ○○% 비슷해요)
     필수 재료를 넣었는가 40% + 재료별 비율이 허용 범위 안인가 45% + 관계없는 재료가 적은가 15%
     허용 범위는 넓게 잡아요. (집마다 레시피가 다르니까)
   ============================================================ */

const GG_COUNTRIES = ['한국', '일본', '중국', '이탈리아', '프랑스', '멕시코', '인도', '태국', '베트남', '미국', '튀르키예'];

const GG_RECIPES = [
  /* ---------------- 한국 ---------------- */
  { id: 'doenjang-jjigae', cook: ['boil'], name: '된장찌개', country: '한국', type: 'soup', sure: 'high',
    intro: '된장은 콩을 발효시켜 만든 한국의 대표 장(醬)이에요. 집집마다 맛이 달라서 "손맛"이라는 말도 있어요.',
    note: '된장 양과 물 양은 집마다 차이가 큼',
    ing: [['broth', 340, { alt: ['water'] }], ['doenjang', 40], ['tofu', 150], ['zucchini', 100], ['onion', 60],
          ['scallion', 20, { opt: true }], ['garlic', 10, { opt: true }], ['chili', 10, { opt: true }], ['gochugaru', 3, { opt: true }]] },

  { id: 'kimchi-fried-rice', cook: ['stirfry'], name: '김치볶음밥', country: '한국', type: 'stirfry', sure: 'high',
    intro: '김치는 채소를 소금에 절여 발효시킨 음식이에요. 한국에는 계절마다 다양한 김치가 있어요.',
    note: '김치 염도에 따라 소금/간장은 달라짐',
    ing: [['rice', 300], ['kimchi', 200], ['oil', 15, { alt: ['sesameoil', 'oliveoil'] }], ['egg', 50, { opt: true }], ['scallion', 20, { opt: true }],
          ['soy', 10, { opt: true }], ['sesameoil', 3, { opt: true }], ['pork', 50, { opt: true, alt: ['chicken', 'beef'] }], ['sugar', 3, { opt: true }]] },

  { id: 'bulgogi', cook: ['stirfry'], name: '불고기', country: '한국', type: 'stirfry', sure: 'high', sweet: 3.5, ranges: { oil: [0, 8] },
    intro: '불고기는 "불에 구운 고기"라는 뜻이에요. 달콤 짭짤한 간장 양념은 외국 사람들에게도 인기가 많아요.',
    note: '소고기 대신 돼지고기, 닭고기도 허용',
    ing: [['beef', 300, { alt: ['pork', 'chicken'] }], ['onion', 100], ['soy', 40], ['sugar', 15], ['garlic', 10], ['scallion', 30, { opt: true }],
          ['carrot', 30, { opt: true }], ['mushroom', 50, { opt: true }], ['sesameoil', 8, { opt: true }], ['pepper', 1, { opt: true }]] },

  { id: 'japchae', cook: ['boil', 'stirfry', 'toss'], name: '잡채', country: '한국', type: 'stirfry', sure: 'mid', sweet: 2.5, ranges: { main: [15, 65] },
    intro: '잡채는 잔칫상에 빠지지 않는 음식이에요. 당면은 고구마 전분으로 만들어요.',
    note: '당면은 삶기 전(마른 것) 무게 기준. 고기·버섯은 선택',
    ing: [['glass', 100], ['spinach', 80], ['carrot', 50], ['onion', 60], ['soy', 30], ['sugar', 12], ['sesameoil', 12], ['oil', 15, { opt: true }],
          ['mushroom', 50, { opt: true }], ['beef', 80, { opt: true, alt: ['pork', 'chicken'] }], ['garlic', 8, { opt: true }]] },

  { id: 'tteokbokki', cook: ['boil'], name: '떡볶이', country: '한국', type: 'stirfry', sure: 'mid', sweet: 5, ranges: { water: [20, 50], salt: [0.6, 1.4], oil: [0, 8] },
    intro: '떡볶이는 원래 궁중에서 간장으로 볶아 먹던 음식이었어요. 지금은 매콤한 고추장 떡볶이가 길거리 간식으로 유명해요.',
    note: '국물 양, 고추장·설탕 비율은 집마다 차이가 큼',
    ing: [['ricecake', 300], ['water', 300, { alt: ['broth'] }], ['gochujang', 50], ['sugar', 20], ['fishcake', 100, { opt: true }], ['soy', 10, { opt: true }],
          ['gochugaru', 8, { opt: true }], ['scallion', 30, { opt: true }], ['cabbage', 50, { opt: true }]] },

  /* ---------------- 일본 ---------------- */
  { id: 'udon', cook: ['boil'], name: '우동', country: '일본', type: 'noodle', sure: 'mid',
    intro: '우동은 굵고 쫄깃한 밀가루 면이에요. 일본에서는 지역마다 국물 맛과 고명이 달라요.',
    note: '일본식 국물(가쓰오 다시)은 육수로 대신함. 면은 삶은 면 기준',
    ing: [['udon', 400], ['broth', 600, { alt: ['water'] }], ['soy', 55], ['scallion', 20, { opt: true }], ['fishcake', 40, { opt: true }],
          ['egg', 50, { opt: true }], ['sugar', 5, { opt: true }]] },

  { id: 'miso-soup', cook: ['boil'], name: '미소시루', country: '일본', type: 'soup', sure: 'high', ranges: { main: [30, 90] },
    intro: '미소시루는 일본의 아침 식탁에 자주 오르는 된장국이에요. 콩으로 만든 "미소"를 풀어 끓여요.',
    note: '한국 된장찌개와 비교해 보기 좋음',
    ing: [['broth', 500, { alt: ['water'] }], ['miso', 40, { alt: ['doenjang'] }], ['tofu', 80], ['seaweed', 3], ['scallion', 15, { opt: true }]] },

  /* ---------------- 중국 ---------------- */
  { id: 'tomato-egg', cook: ['stirfry'], name: '토마토달걀볶음', country: '중국', type: 'stirfry', sure: 'high', sweet: 2.5,
    intro: '토마토달걀볶음은 중국 가정에서 가장 흔한 집밥이에요. 토마토는 중국에서 "서쪽에서 온 붉은 감"이라고 불러요.',
    note: '설탕을 넣는 집과 안 넣는 집이 있음',
    ing: [['tomato', 300], ['egg', 150], ['oil', 20], ['salt', 5], ['sugar', 8, { opt: true }], ['scallion', 15, { opt: true }]] },

  { id: 'mapo-tofu', cook: ['stirfry', 'boil'], name: '마파두부', country: '중국', type: 'stirfry', sure: 'low', ranges: { main: [30, 85] },
    intro: '마파두부는 중국 쓰촨 지방에서 유래한 얼얼하고 매콤한 두부 요리예요. 쓰촨 사람들은 매운맛을 즐겨요.',
    note: '두반장 양 불확실. 산초(화자오)와 전분은 재료에 없어서 뺌',
    ing: [['tofu', 400], ['pork', 100, { alt: ['beef', 'chicken'] }], ['doubanjiang', 30], ['broth', 100, { alt: ['water'] }], ['garlic', 10], ['scallion', 20, { opt: true }],
          ['oil', 20], ['soy', 10, { opt: true }], ['sugar', 3, { opt: true }], ['gochugaru', 3, { opt: true }], ['pepper', 1, { opt: true }]] },

  /* ---------------- 이탈리아 ---------------- */
  { id: 'tomato-spaghetti', cook: ['boil', 'stirfry'], name: '토마토 스파게티', country: '이탈리아', type: 'noodle', sure: 'high',
    intro: '이탈리아에서는 면 요리를 "파스타"라고 불러요. 모양에 따라 수백 가지 종류가 있어요.',
    note: '면 삶는 물의 소금은 계산하지 않음. 면은 마른 면 기준',
    ing: [['spaghetti', 200], ['tomatosauce', 250], ['oliveoil', 20, { alt: ['oil'] }], ['garlic', 10], ['onion', 50, { opt: true }],
          ['basil', 5, { opt: true }], ['salt', 3, { opt: true }], ['pepper', 1, { opt: true }]] },

  { id: 'caprese', cook: ['toss'], name: '카프레제 샐러드', country: '이탈리아', type: 'salad', sure: 'high', ranges: { main: [20, 70] },
    intro: '카프레제는 빨강(토마토), 하양(모짜렐라), 초록(바질)으로 이탈리아 국기 색을 닮았어요.',
    note: '재료가 단순해서 비율 차이가 크지 않음',
    ing: [['tomato', 250], ['mozzarella', 150], ['basil', 10], ['oliveoil', 20, { alt: ['oil'] }], ['salt', 2, { opt: true }], ['pepper', 1, { opt: true }]] },

  /* ---------------- 프랑스 ---------------- */
  { id: 'onion-soup', cook: ['stirfry', 'boil', 'grill'], name: '어니언 수프', country: '프랑스', type: 'soup', sure: 'mid', ranges: { main: [30, 85] },
    intro: '프랑스 어니언 수프는 양파를 오래 볶아 단맛을 내요. 위에 빵과 치즈를 얹어 구워 먹어요.',
    note: '그뤼예르 치즈가 없어서 모짜렐라/체다로 대신함. 양파 양 불확실',
    ing: [['onion', 400], ['butter', 30, { alt: ['oil'] }], ['broth', 500, { alt: ['water'] }], ['baguette', 40, { opt: true }],
          ['mozzarella', 40, { opt: true, alt: ['cheddar'] }], ['salt', 5, { opt: true }], ['pepper', 1, { opt: true }], ['flour', 10, { opt: true }]] },

  { id: 'nicoise', cook: ['boil', 'toss'], name: '니수아즈 샐러드', country: '프랑스', type: 'salad', sure: 'mid',
    intro: '니수아즈 샐러드는 프랑스 남부 도시 니스에서 시작된 샐러드예요. 참치, 달걀, 올리브가 들어가요.',
    note: '감자·익힌 채소 포함 여부는 요리사마다 의견이 갈림(전통파는 안 넣음)',
    ing: [['tuna', 100], ['egg', 100], ['tomato', 150], ['olive', 40], ['oliveoil', 20, { alt: ['oil'] }], ['potato', 100, { opt: true }],
          ['lettuce', 80, { opt: true }], ['vinegar', 10, { opt: true }], ['salt', 2, { opt: true }], ['pepper', 1, { opt: true }]] },

  /* ---------------- 멕시코 ---------------- */
  { id: 'taco', cook: ['stirfry', 'grill'], name: '타코', country: '멕시코', type: 'stirfry', sure: 'mid', ranges: { oil: [0, 8] },
    intro: '타코는 멕시코의 대표 길거리 음식이에요. 토르티야에 원하는 속재료를 싸서 먹어요.',
    note: '속재료 종류가 매우 다양함. 소고기 외에 돼지고기, 닭고기 허용',
    ing: [['tortilla', 120], ['beef', 200, { alt: ['pork', 'chicken'] }], ['onion', 50], ['tomato', 80, { opt: true }], ['lettuce', 50, { opt: true }],
          ['cheddar', 50, { opt: true, alt: ['mozzarella'] }], ['salsa', 60, { opt: true }], ['cumin', 2, { opt: true }], ['lime', 10, { opt: true }],
          ['salt', 5, { opt: true }], ['oil', 10, { opt: true }]] },

  { id: 'guacamole', cook: ['toss'], name: '과카몰리', country: '멕시코', type: 'salad', sure: 'high', ranges: { oil: [0, 10], main: [40, 85] },
    intro: '과카몰리는 아주 오래전 아즈텍 사람들이 먹던 아보카도 소스에서 유래했다고 해요. 멕시코에서는 타코와 함께 먹어요.',
    note: '고수가 재료에 없어서 뺌',
    ing: [['avocado', 300], ['onion', 40], ['lime', 20], ['salt', 3], ['tomato', 60, { opt: true }], ['chili', 5, { opt: true }]] },

  /* ---------------- 인도 ---------------- */
  { id: 'chicken-curry', cook: ['stirfry', 'boil'], name: '치킨 카레', country: '인도', type: 'soup', sure: 'mid', ranges: { water: [25, 70] },
    intro: '카레는 여러 가지 향신료를 섞어 만드는 인도 요리에서 시작했어요. 집집마다 향신료 배합이 달라요.',
    note: '인도식(마살라)과 일본식(카레가루) 차이가 큼. 향신료 비율 불확실',
    ing: [['chicken', 300, { alt: ['pork', 'beef'] }], ['onion', 150], ['curry', 20, { alt: ['turmeric', 'cumin'] }], ['water', 400, { alt: ['broth'] }], ['oil', 20, { alt: ['butter'] }],
          ['salt', 7], ['tomato', 100, { opt: true }], ['garlic', 10, { opt: true }], ['potato', 100, { opt: true }], ['coconut', 100, { opt: true, alt: ['milk'] }],
          ['turmeric', 2, { opt: true }], ['cumin', 2, { opt: true }]] },

  { id: 'dal', cook: ['boil'], name: '달(렌틸콩) 수프', country: '인도', type: 'soup', sure: 'mid',
    intro: '달은 렌틸콩 같은 콩을 푹 끓인 인도의 대표 집밥이에요. 밥이나 난과 함께 먹어요.',
    note: '렌틸콩 양과 향신료 비율 불확실',
    ing: [['lentil', 150], ['water', 600, { alt: ['broth'] }], ['onion', 80], ['turmeric', 3], ['cumin', 3], ['salt', 6], ['tomato', 80, { opt: true }],
          ['garlic', 10, { opt: true }], ['oil', 20, { opt: true, alt: ['butter'] }], ['chili', 5, { opt: true }]] },

  /* ---------------- 태국 ---------------- */
  { id: 'pad-thai', cook: ['boil', 'stirfry'], name: '팟타이', country: '태국', type: 'noodle', sure: 'mid', sweet: 3,
    intro: '팟타이는 태국의 대표 볶음 쌀국수예요. 달콤하고 짭짤하고 새콤한 맛이 어우러져요.',
    note: '타마린드 소스는 설탕+식초+피시소스로 대신함',
    ing: [['ricenoodle', 150], ['shrimp', 100, { alt: ['chicken', 'pork'] }], ['egg', 100], ['beansprout', 100], ['fishsauce', 30], ['sugar', 20], ['vinegar', 15, { alt: ['lime'] }],
          ['oil', 25], ['scallion', 30, { opt: true }], ['peanut', 30, { opt: true }], ['tofu', 50, { opt: true }], ['chili', 5, { opt: true }], ['lime', 20, { opt: true }]] },

  { id: 'tom-yum-goong', cook: ['boil'], name: '똠얌꿍', country: '태국', type: 'soup', sure: 'low',
    intro: '똠얌꿍은 새콤하고 매콤한 태국의 새우 수프예요. 레몬그라스 같은 허브 향이 특징이에요.',
    note: '갈랑갈, 카피르라임잎이 재료에 없음. 맑은 국물/코코넛 국물 두 종류가 있어 비율이 불확실',
    ing: [['broth', 500, { alt: ['water'] }], ['shrimp', 150], ['mushroom', 80], ['lemongrass', 20, { alt: ['lime'] }], ['lime', 30], ['fishsauce', 30], ['chili', 10],
          ['coconut', 100, { opt: true, alt: ['milk'] }], ['tomato', 50, { opt: true }], ['sugar', 5, { opt: true }]] },

  /* ---------------- 베트남 ---------------- */
  { id: 'pho', cook: ['boil'], name: '쌀국수', country: '베트남', type: 'noodle', sure: 'mid', ranges: { water: [0, 70] },
    intro: '쌀국수("퍼")는 베트남의 대표 국물 요리예요. 쌀로 만든 면과 오래 끓인 육수가 특징이에요.',
    note: '원래는 소뼈를 오래 우린 육수. 향신료(팔각, 계피)는 재료에 없어 뺌',
    ing: [['ricenoodle', 150], ['broth', 650, { alt: ['water'] }], ['beef', 100, { alt: ['chicken', 'pork'] }], ['onion', 50], ['fishsauce', 30], ['beansprout', 60, { opt: true }],
          ['scallion', 20, { opt: true }], ['lime', 20, { opt: true }], ['chili', 5, { opt: true }], ['basil', 5, { opt: true }]] },

  { id: 'summer-roll', cook: ['boil', 'toss'], name: '월남쌈', country: '베트남', type: 'salad', sure: 'mid', sweet: 4, ranges: { oil: [0, 5], water: [0, 15] },
    intro: '월남쌈은 얇은 라이스페이퍼에 채소와 새우를 싸서 소스에 찍어 먹어요. 베트남에서는 "고이꾸온"이라고 불러요.',
    note: '찍어 먹는 소스 비율은 집마다 다름',
    ing: [['ricepaper', 30], ['shrimp', 100, { alt: ['chicken', 'pork'] }], ['lettuce', 60], ['cucumber', 60], ['ricenoodle', 40, { opt: true }], ['carrot', 50, { opt: true }],
          ['basil', 10, { opt: true }], ['fishsauce', 10, { opt: true }], ['sugar', 10, { opt: true }], ['lime', 10, { opt: true }], ['water', 30, { opt: true }]] },

  /* ---------------- 미국 ---------------- */
  { id: 'mac-and-cheese', cook: ['boil', 'grill'], name: '맥앤치즈', country: '미국', type: 'noodle', sure: 'mid',
    intro: '맥앤치즈는 마카로니와 치즈 소스로 만드는 미국의 대표 집밥이에요. 간단해서 어린이에게 인기가 많아요.',
    note: '치즈 소스(루) 비율은 집마다 다름. 마카로니는 마른 것 기준',
    ing: [['macaroni', 200], ['milk', 300], ['cheddar', 150, { alt: ['mozzarella'] }], ['butter', 30], ['flour', 20], ['salt', 3, { opt: true }], ['pepper', 1, { opt: true }]] },

  { id: 'coleslaw', cook: ['toss'], name: '코울슬로', country: '미국', type: 'salad', sure: 'high', sweet: 4, ranges: { oil: [0, 10], main: [40, 85] },
    intro: '코울슬로는 "양배추 샐러드"라는 뜻이에요. 햄버거나 치킨과 함께 먹는 미국의 곁들임 음식이에요.',
    note: '',
    ing: [['cabbage', 250], ['carrot', 50], ['mayo', 60], ['vinegar', 10], ['sugar', 10], ['salt', 2], ['pepper', 1, { opt: true }], ['onion', 20, { opt: true }]] },

  /* ---------------- 튀르키예 ---------------- */
  { id: 'turkish-lentil-soup', cook: ['boil'], name: '렌틸콩 수프', country: '튀르키예', type: 'soup', sure: 'mid',
    intro: '튀르키예의 렌틸콩 수프는 식당에서 가장 먼저 나오는 수프로 사랑받아요. 레몬을 짜서 먹기도 해요.',
    note: '인도 달과 비교해 보기 좋음(같은 렌틸콩, 다른 향신료)',
    ing: [['lentil', 150], ['onion', 80], ['carrot', 50], ['water', 700, { alt: ['broth'] }], ['oil', 20, { alt: ['butter', 'oliveoil'] }], ['salt', 7],
          ['potato', 50, { opt: true }], ['tomatosauce', 30, { opt: true }], ['gochugaru', 3, { opt: true }], ['cumin', 2, { opt: true }], ['lime', 15, { opt: true }]] },

  /* ================= 디저트 ================= */
  { id: 'patbingsu', cook: ['boil', { game: 'chill', min: 240, freeze: true }], name: '팥빙수', country: '한국', type: 'dessert', sure: 'mid',
    intro: '팥빙수는 곱게 간 얼음 위에 달콤한 팥을 올린 한국의 여름 디저트예요. 조선 시대에도 얼음 창고(석빙고)의 얼음을 먹었대요.',
    note: '팥은 마른 팥을 삶아 설탕에 조린다고 보고 마른 무게로 적음. 얼음 대신 우유를 얼려 갈기도 함',
    ing: [['ice', 300, { alt: ['milk'] }], ['redbean', 80], ['condensedmilk', 40], ['sugar', 20], ['milk', 100, { opt: true }],
          ['ricecake', 30, { opt: true }], ['strawberry', 50, { opt: true }], ['nuts', 10, { opt: true }]] },

  { id: 'hotteok', cook: ['knead', 'grill'], name: '호떡', country: '한국', type: 'dessert', sure: 'mid',
    intro: '호떡은 반죽 속에 흑설탕과 계피를 넣고 납작하게 구운 한국의 겨울 길거리 간식이에요. 속이 뜨거우니 조심해서 먹어요!',
    note: '반죽(밀가루·이스트·우유)과 속(흑설탕·계피·견과류) 비율',
    ing: [['flour', 150, { alt: ['glutinousflour'] }], ['milk', 100, { alt: ['water'] }], ['yeast', 3], ['sugar', 10], ['brownsugar', 40, { alt: ['sugar'] }],
          ['cinnamon', 2], ['oil', 15], ['nuts', 20, { opt: true }], ['salt', 1, { opt: true }]] },

  /* ---------------- 미국 ---------------- */
  { id: 'pancake', cook: ['toss', 'grill'], name: '팬케이크', country: '미국', type: 'dessert', sure: 'high', ranges: { sugar: [2, 20] },
    intro: '팬케이크는 밀가루 반죽을 프라이팬에 동그랗게 구운 미국의 아침 식사예요. 메이플시럽을 듬뿍 뿌려 먹어요.',
    note: '반죽 비율: 밀가루 1 : 우유 1.3 : 달걀 0.7 정도',
    ing: [['flour', 150], ['milk', 200], ['egg', 100], ['sugar', 20], ['bakingpowder', 6], ['butter', 20],
          ['maple', 40, { opt: true, alt: ['honey'] }], ['salt', 1, { opt: true }], ['blueberry', 50, { opt: true }]] },

  { id: 'brownie', cook: ['toss', 'grill'], name: '브라우니', country: '미국', type: 'dessert', sure: 'mid', ranges: { sugar: [10, 40] },
    intro: '브라우니는 초콜릿과 버터를 듬뿍 넣어 꾸덕하게 구운 미국의 초콜릿 케이크예요. 1890년대 미국 시카고의 호텔에서 처음 만들어졌대요.',
    note: '오븐에 굽기를 굽기 미니게임으로 대신함. 설탕 비율이 높아 sugar 범위를 넓힘',
    ing: [['chocolate', 150], ['butter', 100], ['sugar', 120], ['egg', 100], ['flour', 60], ['cocoa', 20, { opt: true }],
          ['nuts', 30, { opt: true }], ['vanilla', 3, { opt: true }], ['salt', 1, { opt: true }]] },

  /* ---------------- 프랑스 ---------------- */
  { id: 'crepe', cook: ['toss', 'grill', 'whip'], name: '크레페', country: '프랑스', type: 'dessert', sure: 'mid', ranges: { sugar: [2, 20] },
    intro: '크레페는 아주 얇게 부친 프랑스의 밀전병이에요. 생크림과 과일을 올려 돌돌 말아 먹어요.',
    note: '반죽은 묽게(밀가루 1 : 우유 2.5). 생크림·과일은 속 재료',
    ing: [['flour', 100], ['milk', 250], ['egg', 100], ['sugar', 15], ['butter', 15], ['cream', 100, { opt: true }],
          ['strawberry', 100, { opt: true, alt: ['banana', 'blueberry'] }], ['salt', 1, { opt: true }]] },

  /* ---------------- 이탈리아 ---------------- */
  { id: 'pannacotta', cook: ['boil', { game: 'chill', min: 240 }], name: '판나코타', country: '이탈리아', type: 'dessert', sure: 'high',
    intro: '판나코타는 "익힌 크림"이라는 뜻이에요. 생크림을 데워 젤라틴으로 말랑하게 굳힌 이탈리아 북부의 디저트예요.',
    note: '젤라틴은 크림·우유 400mL에 6g 정도. 너무 많으면 고무처럼 딱딱해짐',
    ing: [['cream', 300], ['milk', 100], ['sugar', 40], ['gelatin', 6], ['vanilla', 3, { opt: true }],
          ['blueberry', 50, { opt: true, alt: ['strawberry', 'mango'] }]] },

  /* ---------------- 인도 ---------------- */
  { id: 'mango-lassi', cook: ['toss'], name: '망고 라씨', country: '인도', type: 'dessert', sure: 'high', ranges: { main: [30, 70], sugar: [2, 20] },
    intro: '라씨는 요거트로 만드는 인도의 시원한 음료예요. 매운 커리를 먹을 때 입안을 달래 줘요.',
    note: '믹서에 가는 것을 버무리기 미니게임으로 대신함',
    ing: [['mango', 200], ['yogurt', 200], ['milk', 100], ['sugar', 15, { alt: ['honey'] }], ['ice', 50, { opt: true }], ['cinnamon', 1, { opt: true }]] },

  /* ---------------- 멕시코 ---------------- */
  { id: 'churros', cook: ['boil', 'knead', 'fry'], name: '츄러스', country: '멕시코', type: 'dessert', sure: 'mid', ranges: { oil: [10, 50], water: [10, 50] },
    intro: '츄러스는 반죽을 길게 짜서 기름에 튀긴 뒤 시나몬 설탕을 묻힌 간식이에요. 스페인에서 시작해 멕시코에서 사랑받고 있어요.',
    note: '튀김 기름 양이 많아 oil 범위를 넓힘. 실제로 먹는 기름은 일부',
    ing: [['flour', 150], ['water', 200], ['butter', 30], ['sugar', 40], ['cinnamon', 4], ['oil', 200], ['salt', 1, { opt: true }],
          ['egg', 50, { opt: true }], ['chocolate', 40, { opt: true }]] },

  /* ---------------- 튀르키예 ---------------- */
  { id: 'sutlac', cook: ['boil', { game: 'chill', min: 120 }], name: '쌀 푸딩', country: '튀르키예', type: 'dessert', sure: 'mid',
    intro: '쉬틀라치는 우유에 쌀을 넣고 끓여 만든 튀르키예의 쌀 푸딩이에요. 위에 시나몬 가루를 솔솔 뿌려 먹어요.',
    note: '밥(익힌 쌀) 기준. 옥수수전분으로 걸쭉하게 만듦',
    ing: [['rice', 100], ['milk', 500], ['sugar', 50], ['cornstarch', 15], ['cinnamon', 2, { opt: true }], ['vanilla', 2, { opt: true }]] }
];
