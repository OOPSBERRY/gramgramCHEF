/* ============================================================
   셰프 데이터  (직접 추가·수정하는 파일)
   ------------------------------------------------------------
   ★ 셰프를 심사에 넣으려면 ready: true 로 바꾸고 lines(대사)를 채우세요.
     ready 가 true 인 셰프만 점수에 합산되고, 100점 만점으로 자동 환산됩니다. (코드 수정 필요 없음)
   ★ focus : 이 셰프가 중점으로 보는 항목과 중요도(숫자가 클수록 점수에 크게 반영). 25점 만점으로 환산됩니다.
       쓸 수 있는 항목: salt(소금 비율) sugar(단맛 비율) oil(기름 비율) balance(맛의 균형) water(물·육수 비율)
                       variety(재료 다양성) main(주재료 비중) amount(전체 양) combos(이상한 조합) fit(요리 종류에 맞는 재료)
                       recipe(레시피 일치도, 실제 요리 도전에서만) price(가격·예산) accuracy(계산 확인 정확성)
                       creative(창의성) nameq(요리 이름) brave(도전 정신)
   ★ base  : 기본 점수 비율(0~1). 해피 셰프처럼 후한 셰프는 높게. (0.5 이면 최소 12.5점부터 시작)
   ★ avatar: 얼굴 그림 설정  (brow: angry/flat/soft/happy, mouth: shout/line/smile/grin, extra: none/glasses/mustache/blush)
   ★ lines : 대사. 점수대(high 80%↑ / mid 50%↑ / low) 안에 상황별로 여러 개씩 적으면 랜덤으로 골라요.
       {dish} 자리에 요리 이름이 들어갑니다.
       상황: general(기본) balanced(간이 알맞음) tooSalty(너무 짬) tooBland(싱거움) tooSweet(너무 달다)
             tooOily(느끼함) notEnough(재료 부족) weirdCombo(이상한 조합)
             similarRecipe(레시피와 비슷함) notSimilar(레시피와 다름)
             lowVariety(재료가 적음) tooMany(재료가 너무 많음) mainOff(주재료가 불분명) typeMismatch(요리 종류와 재료가 안 맞음) wellMade(구성이 좋음)
             overBudget(예산 초과) budgetPerfect(예산을 잘 지킴) pricey(비쌈) calcExact(계산 정확) calcOff(계산이 틀림) calcSkipped(계산 건너뜀)
             nameGreat(이름이 멋짐) boldMix(창의적인 조합) tryHard(도전 정신)
       ★ priority : 여러 상황이 겹칠 때 먼저 말할 순서 (가장 심한 상황이 우선이고, 같으면 이 순서)
       없는 상황은 다른 점수대의 같은 상황 대사 → 기본(general) 대사 순서로 대신 씁니다.
   ============================================================ */
const GG_CHEFS = [
  {
    id: 'bureok', name: '버럭 셰프', trait: '호통은 쳐도 정은 많아요', color: '#C0392B', ready: true,
    avatar: { brow: 'angry', mouth: 'shout', extra: 'blush', skin: '#F2C29B' },
    focus: [{ metric: 'salt', weight: 9 }, { metric: 'sugar', weight: 5 }, { metric: 'balance', weight: 8 }, { metric: 'oil', weight: 3 }],
    base: 0,
    priority: ['notEnough', 'weirdCombo', 'notSimilar', 'tooSalty', 'tooSweet', 'tooBland', 'tooOily', 'similarRecipe', 'balanced'],
    lines: {
      high: {
        general: [
          '어허! {dish}, 간이 딱 맞잖아! 호통칠 데가 하나도 없구나!',
          '허, 이거 봐라? {dish}에서 정성이 느껴지는군! 합격이다!',
          '좋아, 아주 좋아! {dish}, 한 숟가락 더 먹고 싶어지는 맛이야!'
        ],
        balanced: [
          '짠맛 단맛 균형이 완벽해! {dish}, 이게 바로 간이 맞는다는 거야!',
          '으음! {dish}, 간이 착착 맞아! 누가 가르쳐 줬어? 대단하구나!',
          '이야, {dish}! 간 하나는 내가 인정한다! 아주 훌륭해!'
        ],
        similarRecipe: ['{dish}, 이거 진짜 그 요리 맛이 나는데? 레시피를 잘 알고 있구나!']
      },
      mid: {
        general: [
          '음... {dish}, 나쁘진 않은데 아직 2% 부족해! 간을 조금만 더 다듬어 봐!',
          '흠! {dish}, 가능성은 보인다! 하지만 방심하면 안 돼!',
          '{dish}, 먹을 만은 하다! 그런데 한 끗이 모자라! 다시 한 번 해 보자!'
        ],
        balanced: ['{dish}, 간은 괜찮아! 이제 다른 부분을 조금만 더 챙기면 최고야!'],
        tooSalty: [
          '으악! {dish}, 소금을 너무 많이 넣었잖아! 짠맛이 앞서가면 안 돼!',
          '물! 물 좀 줘! {dish}가 너무 짜단 말이야! 소금은 조금씩 넣는 거야!'
        ],
        tooBland: [
          '으음? {dish}, 간이 너무 약해! 소금이나 간장을 조금만 더 넣어 봐!',
          '{dish}, 싱거워도 너무 싱거워! 간이 맛을 살려 주는 거란 말이야!'
        ],
        tooSweet: [
          '{dish}가 왜 이렇게 달아! 설탕은 양념이지 주인공이 아니야!',
          '어어, 단맛이 너무 앞서가네! {dish}, 짠맛과 단맛은 균형이 중요해!'
        ],
        tooOily: ['{dish}에 기름이 너무 많아! 느끼해서 숟가락이 안 가겠어!'],
        notEnough: ['재료가 너무 적잖아! {dish}를 만들려면 재료를 좀 더 채워야지!'],
        weirdCombo: ['{dish}, 이 조합은 뭐야?! 재료끼리 어울리는지부터 생각해 봐!'],
        similarRecipe: ['{dish}, 진짜 그 맛에 가까운걸! 레시피를 제법 잘 알고 있구나!', '오호, 제대로 {dish} 맛이 나는데? 다만 간을 조금만 더 다듬어 봐!'],
        notSimilar: ['이게 {dish}라고? 재료가 좀 달라! 꼭 들어가는 재료부터 챙겨 봐!']
      },
      low: {
        general: [
          '이게 뭐냐, {dish}?! 하지만 포기하지 마라! 다시 하면 돼!',
          '에잇! {dish}, 이대로는 안 돼! 비율을 한 번 더 생각해 보자!',
          '호통부터 치고 싶지만... {dish}, 처음부터 천천히 다시 해 보자!'
        ],
        tooSalty: ['으아악! {dish}, 이건 소금 바다야! 소금은 아주 조금이면 충분해!'],
        tooBland: ['{dish}, 이건 맹물이나 마찬가지야! 간부터 해야지!'],
        tooSweet: ['{dish}, 이건 사탕이야 요리야?! 설탕을 확 줄여 봐!'],
        tooOily: ['{dish}, 기름 범벅이잖아! 기름은 조금만 써도 충분해!'],
        notEnough: ['재료가 이게 다야?! {dish}를 만들기엔 턱없이 부족해! 더 넣어 봐!'],
        weirdCombo: ['이 조합은 아니야! {dish}, 재료끼리 어울리는지 다시 생각해 봐!'],
        notSimilar: ['{dish}라고? 진짜 {dish}와는 거리가 멀어! 레시피를 다시 살펴봐!']
      }
    }
  },
  {
    id: 'kkankkan', name: '깐깐 셰프', trait: '위생과 구성을 꼼꼼히 봐요', color: '#2E86AB', ready: true,
    avatar: { brow: 'flat', mouth: 'line', extra: 'glasses', skin: '#F6D2B0' },
    focus: [{ metric: 'variety', weight: 6 }, { metric: 'main', weight: 5 }, { metric: 'combos', weight: 7 }, { metric: 'fit', weight: 3 },
            { metric: 'recipe', weight: 4 }],      // recipe 는 실제 요리 도전 모드에서만 계산돼요
    base: 0,
    priority: ['weirdCombo', 'typeMismatch', 'notSimilar', 'notEnough', 'lowVariety', 'mainOff', 'tooMany', 'similarRecipe', 'wellMade'],
    lines: {
      high: {
        general: [
          '{dish}, 재료 하나하나를 정성스럽게 골랐군요. 이 정도면 합격입니다.',
          '손질도 구성도 깔끔한 {dish}네요. 제 기준을 통과했습니다.',
          '{dish}, 빈틈이 거의 없군요. 인정합니다.'
        ],
        wellMade: [
          '재료 구성이 균형 잡힌 {dish}예요. 주재료가 분명하고 군더더기도 없군요.',
          '{dish}, 재료가 서로 잘 어울립니다. 주방을 깨끗하게 쓴 것처럼 구성도 깔끔하네요.'
        ],
        similarRecipe: ['{dish}에 꼭 필요한 재료를 모두 챙겼군요. 레시피를 꼼꼼히 봤다는 증거입니다.']
      },
      mid: {
        general: [
          '{dish}, 나쁘지 않지만 세부가 아쉽습니다. 재료 구성을 한 번 더 점검해 보세요.',
          '음, {dish}... 조금만 더 섬세하면 좋겠습니다. 재료의 균형을 살펴보세요.',
          '{dish}, 기본은 갖췄습니다. 다만 마무리가 조금 거칠어요.'
        ],
        wellMade: ['{dish}, 구성은 깔끔합니다. 이제 한 끗만 더 다듬으면 되겠어요.'],
        lowVariety: ['{dish}에 재료가 너무 단출합니다. 한두 가지만 더 곁들이면 풍성해지겠네요.'],
        tooMany: ['재료가 너무 많아서 {dish}의 중심이 흐려졌습니다. 덜어내는 것도 실력이에요.'],
        mainOff: ['{dish}의 주인공이 누구인지 분명하지 않군요. 주재료의 양을 눈에 띄게 해 보세요.'],
        typeMismatch: ['{dish}를 이 종류의 요리로 내려면 재료가 맞아야 합니다. 요리 종류와 재료를 다시 확인해 보세요.'],
        weirdCombo: ['{dish}에 이 조합은 곤란합니다. 재료끼리의 궁합부터 확인해 보세요.'],
        notEnough: ['재료가 부족해서 {dish}를 제대로 평가하기 어렵습니다. 조금 더 채워 주세요.'],
        similarRecipe: ['{dish}의 필수 재료는 잘 챙겼습니다. 비율만 조금 더 다듬으면 좋겠어요.'],
        notSimilar: ['{dish}라기엔 꼭 필요한 재료가 빠졌습니다. 레시피를 다시 확인해 보세요.']
      },
      low: {
        general: [
          '{dish}... 솔직히 말씀드리면 많이 아쉽습니다. 기본 구성부터 다시 짚어 봅시다.',
          '주방은 정확해야 합니다. {dish}는 아직 재료 구성이 정리되지 않았어요.',
          '{dish}, 처음부터 차근차근 다시 해 봅시다. 하나씩 확인하면 분명 나아집니다.'
        ],
        lowVariety: ['{dish}는 재료가 너무 적습니다. 요리가 되려면 재료가 더 필요해요.'],
        tooMany: ['{dish}에 재료를 너무 많이 넣었습니다. 무엇을 만들려는지 알 수 없어요. 줄여 봅시다.'],
        mainOff: ['{dish}의 중심이 되는 재료가 보이지 않습니다. 주재료부터 정해 봅시다.'],
        typeMismatch: ['{dish}는 선택한 요리 종류와 재료가 맞지 않습니다. 종류를 다시 확인해 주세요.'],
        weirdCombo: ['이 조합은 안 됩니다. {dish}의 재료끼리 어울리는지 다시 생각해 주세요.'],
        notEnough: ['재료가 너무 적습니다. {dish}를 만들려면 더 채워야 합니다.'],
        notSimilar: ['{dish}와는 거리가 멉니다. 꼭 들어가는 재료부터 다시 챙겨 봅시다.']
      }
    }
  },
  {
    id: 'gram', name: '그램 셰프', trait: '따뜻하지만 숫자엔 냉철해요', color: '#5E7F4F', ready: true,
    avatar: { brow: 'soft', mouth: 'smile', extra: 'mustache', skin: '#E9B48A' },
    focus: [{ metric: 'accuracy', weight: 10 }, { metric: 'price', weight: 10 }, { metric: 'amount', weight: 5 }],
    base: 0,
    priority: ['overBudget', 'calcOff', 'calcSkipped', 'pricey', 'notEnough', 'calcExact', 'budgetPerfect'],
    lines: {
      high: {
        general: [
          '{dish}, 숫자가 아주 정확하네요. 계산을 꼼꼼히 했군요. 훌륭해요.',
          '예산도 계산도 빈틈이 없는 {dish}예요. 숫자는 거짓말을 하지 않는답니다.',
          '{dish}, 양과 가격이 모두 알맞아요. 차분하게 잘 해냈어요.'
        ],
        calcExact: [
          '총 원가와 총 무게를 정확히 맞혔어요. 이런 정확함이 좋은 요리사의 힘이에요.',
          '{dish}의 숫자를 정확하게 계산했네요. 정말 믿음직해요.'
        ],
        budgetPerfect: [
          '예산 안에서 알뜰하게 만든 {dish}네요. 아주 현명해요.',
          '{dish}, 정해진 예산을 지키면서도 풍성해요. 멋진 계획이에요.'
        ]
      },
      mid: {
        general: [
          '{dish}, 따뜻하게 말씀드릴게요. 숫자를 한 번만 더 확인하면 완벽해요.',
          '{dish}는 좋은 시도예요. 다만 가격과 양을 조금만 더 챙겨 볼까요?',
          '숫자는 차근차근 맞춰 가면 돼요. {dish}, 거의 다 왔어요.'
        ],
        calcExact: ['계산은 정확했어요. {dish}의 가격과 양만 조금 더 다듬어 봐요.'],
        budgetPerfect: ['예산은 잘 지켰어요. {dish}의 양과 계산을 조금만 더 챙기면 좋겠어요.'],
        calcOff: ['계산이 조금 어긋났어요. 괜찮아요, 천천히 다시 더해 보면 돼요.'],
        calcSkipped: ['계산을 건너뛰었네요. 숫자를 직접 세어 보는 경험도 소중해요. 다음엔 꼭 해 봐요.'],
        overBudget: ['예산을 조금 넘었어요. 비싼 재료의 양을 살짝 줄여 볼까요?'],
        pricey: ['{dish}, 재료비가 꽤 많이 들었네요. 같은 맛이라면 더 알뜰한 방법도 있어요.'],
        notEnough: ['재료가 적어서 {dish}의 숫자를 살펴보기 어려워요. 조금 더 채워 볼까요?']
      },
      low: {
        general: [
          '{dish}, 숫자가 많이 어긋났어요. 하지만 괜찮아요. 천천히 다시 계산해 봐요.',
          '냉정하게 말하면 {dish}는 숫자 관리가 필요해요. 하지만 연습하면 분명 좋아져요.',
          '{dish}, 가격과 양을 하나씩 짚어 가며 다시 해 봐요. 제가 응원할게요.'
        ],
        calcOff: ['계산이 많이 달라요. 재료마다 원가를 적어 두고 하나씩 더해 봐요.'],
        calcSkipped: ['계산을 건너뛰었네요. 숫자를 확인하는 것도 요리의 한 부분이에요.'],
        overBudget: ['예산을 많이 넘겼어요. 냉정하게 말하면 이대로는 살림이 어려워요. 다시 줄여 봐요.'],
        pricey: ['{dish}는 재료값이 너무 많이 들었어요. 값비싼 재료를 조금만 줄여 볼까요?'],
        notEnough: ['재료가 너무 적어요. {dish}를 만들려면 양을 더 채워야 해요.']
      }
    }
  },
  {
    id: 'happy', name: '해피 셰프', trait: '뭐든 맛있다고 해요', color: '#E3B04B', ready: true,
    avatar: { brow: 'happy', mouth: 'grin', extra: 'blush', skin: '#F7CFA8' },
    focus: [{ metric: 'creative', weight: 8 }, { metric: 'nameq', weight: 8 }, { metric: 'brave', weight: 9 }],
    base: 0.5,
    priority: ['weirdCombo', 'notEnough', 'nameGreat', 'boldMix', 'tryHard'],
    lines: {
      high: {
        general: [
          '와아! {dish}, 너무너무 맛있어요! 한 그릇 더 주세요!',
          '{dish}라니, 이름부터 맛있어 보여요! 냠냠, 최고예요!',
          '이건 행복의 맛이에요, {dish}! 별 백 개 드릴게요!'
        ],
        nameGreat: [
          '{dish}! 이름이 너무 멋져요! 듣기만 해도 침이 꼴깍 넘어가요!',
          '와, {dish}라는 이름 대박이에요! 맛은 안 먹어 봐도 알겠어요, 최고!'
        ],
        boldMix: [
          '이런 재료 조합을 시도하다니, 정말 창의적이에요! {dish}, 새로운 맛의 발견이에요!',
          '{dish}, 여러 재료가 춤추는 것 같아요! 상상력이 대단해요!'
        ],
        tryHard: [
          '어려운 도전을 해내다니! {dish}를 만든 용기에 박수를 보내요!',
          '{dish}에 도전한 것만으로도 멋져요! 세계 여러 나라의 맛을 만났네요!'
        ]
      },
      mid: {
        general: [
          '{dish}, 맛있어요! 정말이에요! 조금만 더 도전하면 더 맛있어질 거예요!',
          '냠냠, {dish}! 따뜻한 마음이 느껴져요. 다음엔 더 신나는 재료도 넣어 볼까요?',
          '{dish}, 먹는 순간 웃음이 났어요! 이름도 재료도 더 상상해 보면 좋겠어요!'
        ],
        nameGreat: ['{dish}, 이름이 반짝반짝해요! 재료도 같이 반짝이면 더 좋겠어요!'],
        boldMix: ['{dish}, 재미있는 조합이에요! 다음엔 더 용감하게 섞어 봐요!'],
        tryHard: ['{dish}에 도전한 용기가 멋져요! 다음엔 더 잘할 수 있을 거예요!'],
        weirdCombo: ['{dish}, 처음 보는 조합이에요! 신기해요! 저는 맛있게 먹었어요. 다음엔 어울리는 친구들도 찾아봐요!'],
        notEnough: ['{dish}, 작지만 소중한 요리예요! 재료를 조금 더 넣어 볼까요?']
      },
      low: {
        general: [
          '{dish}도 맛있어요! 먹을 수 있는 건 다 맛있는 거니까요! 다음엔 더 멋진 요리가 나올 거예요!',
          '와, {dish}! 용기 있게 만들어 줘서 고마워요! 다음이 더 기대돼요!',
          '{dish}, 저는 좋아요! 한 번 더 도전하면 분명 더 맛있어질 거예요!'
        ],
        weirdCombo: ['{dish}, 정말 독특한 조합이에요! 저는 웃으면서 먹었어요. 다음엔 어울리는 짝을 찾아볼까요?'],
        notEnough: ['{dish}, 작은 요리도 사랑스러워요! 재료를 더 모아서 다시 만들어 봐요!']
      }
    }
  }
];
