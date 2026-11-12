/* 심사: AI 없이 "비율"로 계산합니다. (규칙 숫자는 data/rules.js, 셰프는 data/chefs.js) */
const GGJudge = (function () {
  const NON_SOLID = ['liquid', 'season', 'spice', 'oil', 'sauce'];     // '건더기'에 세지 않는 분류
  const FLAVOR_CATS = ['season', 'spice', 'sauce'];                    // 맛을 내는 재료 분류

  const n1 = (v) => Math.round(v * 10) / 10;
  const fmt = (v) => (Math.round(v * 10) / 10).toLocaleString('ko-KR');
  const rangeText = (r, unit) => r[0] + '~' + r[1] + unit;

  /** 값이 [lo, hi] 안이면 1점, 벗어날수록 0점에 가까워짐 */
  function rangeScore(v, lo, hi) {
    if (v >= lo && v <= hi) return 1;
    if (v < lo) return Math.max(0, 1 - (lo - v) / Math.max(lo, 0.01));
    return Math.max(0, 1 - (v - hi) / Math.max(hi, 0.01));
  }
  const status = (v, r) => (v < r[0] ? 'low' : v > r[1] ? 'high' : 'good');

  /** 이상한 조합 찾기 */
  function findCombos(ids) {
    const has = (list) => list.some((id) => ids.has(id));
    return GG_COMBO_RULES.filter((r) => {
      if (r.pair) return has(r.pair.a) && has(r.pair.b);
      if (r.countOf) return r.countOf.any.filter((id) => ids.has(id)).length >= r.countOf.atLeast;
      return false;
    }).map((r) => r.msg);
  }

  /* 조리하기 대사(data/chefs.js 의 GG_COOK_LINES)를 셰프 대사에 합치기 */
  if (typeof GG_COOK_LINES !== 'undefined') GG_CHEFS.forEach((c) => {
    const add = GG_COOK_LINES[c.id]; if (!add) return;
    ['high', 'mid', 'low'].forEach((t) => { c.lines[t] = Object.assign(c.lines[t] || {}, add[t] || {}); });
    c.priority = ['rawFood', 'methodWrong'].concat(c.priority || [], ['cookClumsy', 'cookGreat', 'hintUsed']);
  });

  /** 받침 유무에 따라 와/과, 은/는 등을 고름 */
  function josa(word, a, b) {
    const c = word.charCodeAt(word.length - 1);
    return (c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0) ? b : a;
  }

  const NEUTRAL_IDS = ['water', 'salt', 'pepper'];      // 레시피에 없어도 넣으면 자연스러운 재료 (관계없는 재료로 세지 않음)

  /** 실제 요리와 얼마나 비슷한가: 필수 재료 40% + 재료별 비율 45% + 관계없는 재료 적음 15% (허용 범위는 넓게) */
  function recipeMatch(rows, W, recipe) {
    const find = (id) => GG_INGREDIENTS.find((i) => i.id === id);
    const byId = {};
    rows.forEach((r) => { byId[r.ing.id] = (byId[r.ing.id] || 0) + r.g; });
    const groups = recipe.ing.filter((t) => find(t[0])).map((t) => {
      const o = t[2] || {}, ing = find(t[0]);
      return { name: ing.name, ids: [t[0]].concat(o.alt || []), g: GGCalc.grams(ing, t[1]), opt: !!o.opt, tol: o.tol || [0.5, 1.8] };
    });
    const Wr = groups.reduce((s, g) => s + g.g, 0) || 1;
    const share = (ids) => (W > 0 ? ids.reduce((s, id) => s + (byId[id] || 0), 0) / W * 100 : 0);

    const required = groups.filter((g) => !g.opt);
    const known = new Set();
    groups.forEach((g) => g.ids.forEach((id) => known.add(id)));

    const rowsOut = [];
    let present = 0, wSum = 0, wScore = 0;
    const missing = [];
    required.forEach((g) => {
      const v = n1(share(g.ids)), ref = g.g / Wr * 100;
      const used = g.ids.filter((id) => byId[id] > 0).map((id) => find(id).name);
      if (!used.length) { missing.push(g.name); wSum += Math.sqrt(g.g / Wr * 100 + 1); rowsOut.push({ status: 'bad', text: g.name + '이(가) 없어요 (꼭 필요한 재료)' }); return; }
      present++;
      const lo = n1(Math.max(0, ref * g.tol[0] - 1)), hi = n1(ref * g.tol[1] + 1.5);
      const sc = rangeScore(v, lo, hi), w = Math.sqrt(ref + 1);
      wSum += w; wScore += w * sc;
      rowsOut.push({ status: status(v, [lo, hi]), text: used.join(', ') + ' ' + fmt(v) + '% (알맞은 범위 ' + lo + '~' + hi + '%)' });
    });

    const extras = rows.filter((r) => !known.has(r.ing.id) && !NEUTRAL_IDS.includes(r.ing.id));
    const extraShare = share(extras.map((r) => r.ing.id));
    if (extras.length) rowsOut.push({ status: 'low', text: '레시피에 없는 재료: ' + extras.map((r) => r.ing.name).join(', ') + ' (전체의 ' + fmt(extraShare) + '%)' });

    const reqScore = required.length ? present / required.length : 1;
    const ratioScore = wSum > 0 ? wScore / wSum : 0;
    const extraScore = Math.max(0, 1 - extraShare / 25 - 0.03 * extras.length);
    const total = W > 0 ? 0.4 * reqScore + 0.45 * ratioScore + 0.15 * extraScore : 0;
    return {
      pct: Math.round(total * 100), total,
      parts: { req: Math.round(reqScore * 100), ratio: Math.round(ratioScore * 100), extra: Math.round(extraScore * 100) },
      reqPresent: present, reqTotal: required.length, missing, extras: extras.map((r) => r.ing.name), rows: rowsOut
    };
  }

  /** 내 요리를 분석해서 항목별 숫자와 점수(0~1)를 만든다 */
  function analyze(items, typeId, recipe, extra) {
    extra = extra || {};
    const type = Object.assign({}, GG_DISH_TYPES.find((t) => t.id === typeId), (recipe && recipe.ranges) || {});   // 레시피에 따로 적은 범위가 있으면 그걸 씀
    const sweetMax = (recipe && recipe.sweet) || type.sweet || 1.5;                                               // 단맛÷짠맛 허용 한도 (디저트는 아주 큼)
    const rows = items.filter((it) => it.amount > 0).map((it) => ({ ing: it.ing, g: GGCalc.grams(it.ing, it.amount) }));
    const W = rows.reduce((s, r) => s + r.g, 0);
    const ids = new Set(rows.map((r) => r.ing.id));
    const pct = (g) => (W > 0 ? g / W * 100 : 0);

    const saltP  = n1(pct(rows.reduce((s, r) => s + r.g * r.ing.salt / 100, 0)));
    const sugarP = n1(pct(rows.filter((r) => ['season', 'sauce', 'sweet'].includes(r.ing.cat)).reduce((s, r) => s + r.g * r.ing.sugar / 100, 0)));   // 채소의 자연 단맛은 빼고, 양념·소스·디저트 재료의 설탕만
    const oilP   = n1(pct(rows.filter((r) => r.ing.cat === 'oil').reduce((s, r) => s + r.g, 0)));
    const waterP = n1(pct(rows.filter((r) => r.ing.cat === 'liquid').reduce((s, r) => s + r.g, 0)));

    const solids = rows.filter((r) => !NON_SOLID.includes(r.ing.cat));
    const solidW = solids.reduce((s, r) => s + r.g, 0);
    const top = solids.slice().sort((a, b) => b.g - a.g)[0];
    const mainP = solidW > 0 ? n1(top.g / solidW * 100) : 0;
    const foodRows = rows.filter((r) => r.ing.cat !== 'liquid');
    const variety = foodRows.length;
    const catCount = new Set(foodRows.map((r) => r.ing.cat)).size;
    const flavorCount = rows.filter((r) => FLAVOR_CATS.includes(r.ing.cat) || (typeId === 'dessert' && r.ing.cat === 'sweet')).length;   // 디저트는 디저트 재료도 맛을 내는 재료
    const combos = findCombos(ids);

    const m = {};
    // 소금
    m.salt = { label: '소금 비율', value: saltP, range: type.salt, score: rangeScore(saltP, ...type.salt), status: status(saltP, type.salt),
      text: '소금 비율 ' + fmt(saltP) + '% (알맞은 범위 ' + rangeText(type.salt, '%') + ')', note: '간장, 된장 등은 소금으로 바꿔서 더했어요' };
    // 설탕
    m.sugar = { label: '단맛(설탕) 비율', value: sugarP, range: type.sugar, score: rangeScore(sugarP, ...type.sugar), status: status(sugarP, type.sugar),
      text: '단맛(설탕) 비율 ' + fmt(sugarP) + '% (알맞은 범위 ' + rangeText(type.sugar, '%') + ')' };
    // 기름
    m.oil = { label: '기름 비율', value: oilP, range: type.oil, score: rangeScore(oilP, ...type.oil), status: status(oilP, type.oil),
      text: '기름 비율 ' + fmt(oilP) + '% (알맞은 범위 ' + rangeText(type.oil, '%') + ')' };
    // 맛의 균형: 단맛÷짠맛 + 맛을 내는 재료의 가짓수
    const ratio = sugarP / Math.max(saltP, 0.1);
    const ratioScore = ratio <= sweetMax ? 1 : Math.max(0, 1 - (ratio - sweetMax) / 2.5);
    const flavorScore = Math.min(1, flavorCount / 3);
    let balance = 0.7 * ratioScore + 0.3 * flavorScore;
    const plain = saltP < 0.1 && sugarP < 0.1;
    if (plain) balance *= 0.5;
    m.balance = { label: '맛의 균형', value: ratio, range: [0, sweetMax], score: balance,
      status: balance >= 0.7 ? 'good' : (ratio > sweetMax ? 'high' : 'low'),
      text: plain ? '맛의 균형: 간이 거의 없어서 밋밋해요' : typeId === 'dessert' ? '맛의 균형: 디저트 재료·양념 ' + flavorCount + '가지' : saltP < 0.1 ? '맛의 균형: 짠맛이 거의 없고 단맛만 있어요' : '단맛 ÷ 짠맛 = ' + fmt(ratio) + ' (알맞은 범위 0~' + sweetMax + '), 양념 ' + flavorCount + '가지' };
    // 물·육수
    m.water = { label: '물·육수 비율', value: waterP, range: type.water, score: rangeScore(waterP, ...type.water), status: status(waterP, type.water),
      text: '물·육수 비율 ' + fmt(waterP) + '% (알맞은 범위 ' + rangeText(type.water, '%') + ')' };
    // 재료 다양성
    const nScore = variety < 4 ? variety / 4 : variety <= 10 ? 1 : Math.max(0, 1 - (variety - 10) / 6);
    m.variety = { label: '재료 다양성', value: variety, range: GG_COMMON_RANGES.variety,
      score: 0.6 * nScore + 0.4 * Math.min(1, catCount / 3), status: status(variety, GG_COMMON_RANGES.variety),
      text: '재료 ' + variety + '가지, ' + catCount + '종류 (알맞은 범위 ' + rangeText(GG_COMMON_RANGES.variety, '가지') + ')' };
    // 주재료 비중
    m.main = { label: '주재료 비중', value: mainP, range: type.main, score: solidW > 0 ? rangeScore(mainP, ...type.main) : 0, status: solidW > 0 ? status(mainP, type.main) : 'low',
      text: solidW > 0 ? '주재료 ' + top.ing.name + ' ' + fmt(mainP) + '% (알맞은 범위 ' + rangeText(type.main, '%') + ')' : '주재료가 없어요 (고기, 채소 등 건더기 재료를 넣어 보세요)' };
    // 전체 양
    m.amount = { label: '전체 양', value: W, range: GG_COMMON_RANGES.amount, score: rangeScore(W, ...GG_COMMON_RANGES.amount), status: status(W, GG_COMMON_RANGES.amount),
      text: '총 무게 ' + Math.round(W).toLocaleString('ko-KR') + 'g (알맞은 범위 ' + GG_COMMON_RANGES.amount.map((v) => v.toLocaleString('ko-KR')).join('~') + 'g)' };
    // 이상한 조합
    m.combos = { label: '재료 궁합', value: combos.length, score: Math.max(0, 1 - 0.5 * combos.length), status: combos.length ? 'bad' : 'good', list: combos,
      text: combos.length ? '재료 궁합: ' + combos.join(' / ') : '재료 궁합: 이상한 조합이 없어요' };
    // 요리 종류에 맞는 재료
    let fit = 1, fitText = '요리 종류와 재료가 잘 맞아요';
    if (typeId === 'noodle' && !GG_NOODLE_IDS.some((id) => ids.has(id))) { fit = 0.2; fitText = '면 요리인데 면 재료가 없어요'; }
    if (typeId === 'salad') {
      const vegW = solids.filter((r) => r.ing.cat === 'veg').reduce((s, r) => s + r.g, 0);
      const vegP = solidW > 0 ? vegW / solidW * 100 : 0;
      fit = Math.min(1, vegP / 40);
      fitText = '샐러드의 채소 비중 ' + fmt(vegP) + '% (알맞은 범위 40% 이상)';
    }
    if (typeId === 'dessert') {
      const odd = rows.filter((r) => GG_DESSERT_ODD_CATS.includes(r.ing.cat));
      const sweetLo = Math.max(0.1, type.sugar[0]);
      fit = Math.min(1, sugarP / sweetLo) * (odd.length ? 0.4 : 1);
      fitText = odd.length ? '디저트에 ' + odd.map((r) => r.ing.name).join(', ') + '이(가) 들어갔어요'
        : '디저트의 단맛 ' + fmt(sugarP) + '% (알맞은 범위 ' + type.sugar[0] + '% 이상)';
    }
    m.fit = { label: '종류와 재료', value: fit, score: fit, status: fit >= 0.8 ? 'good' : 'low', text: fitText };

    // ----- 그램 셰프가 보는 것: 가격과 예산, 계산 정확성 -----
    const cost = GGCalc.totalCost(items.filter((it) => it.amount > 0));
    const budget = extra.budget || null;
    if (budget) {
      const over = cost - budget;
      m.price = { label: '예산', value: cost, score: over <= 0 ? 1 : Math.max(0, 1 - over / budget * 2), status: over <= 0 ? 'good' : 'high',
        text: '총 원가 ' + GGCalc.won(cost) + ' (예산 ' + GGCalc.won(budget) + (over <= 0 ? ' 이내)' : ', ' + GGCalc.won(over) + ' 초과)') };
    } else {
      const per = W > 0 ? Math.round(cost / W * 100) : 0, rg = [0, 1500];
      m.price = { label: '가격', value: per, range: rg, score: rangeScore(per, ...rg), status: status(per, rg),
        text: '100g당 원가 ' + per.toLocaleString('ko-KR') + '원 (알맞은 범위 ' + rg[0] + '~' + rg[1].toLocaleString('ko-KR') + '원)' };
    }
    if (extra.calc) {
      const c = extra.calc, trueW = Math.round(W), answer = '정답: 총 원가 ' + GGCalc.won(cost) + ', 총 무게 ' + trueW.toLocaleString('ko-KR') + 'g';
      let sc, text, st;
      if (c.skipped) { sc = 0.3; st = 'low'; text = '계산 확인: 건너뛰었어요 (' + answer + ')'; }
      else {
        const f = (e) => (e <= 0.02 ? 1 : Math.max(0, 1 - (e - 0.02) / 0.08));           // 오차 2% 이내면 만점, 10%면 0점
        const errC = cost > 0 ? Math.abs(c.cost - cost) / cost : 0, errW = W > 0 ? Math.abs(c.grams - W) / W : 0;
        sc = 0.5 * f(errC) + 0.5 * f(errW);
        if (c.helped) sc = Math.min(sc, 0.5);                                               // 계산 도우미(정답 보기)를 썼으면 최대 절반
        st = sc >= 0.9 ? 'good' : 'low';
        text = '계산 확인: 총 원가 ' + GGCalc.won(c.cost) + ', 총 무게 ' + Math.round(c.grams).toLocaleString('ko-KR') + 'g (' + answer + ')' + (c.helped ? ', 도움을 받았어요' : '');
      }
      m.accuracy = { label: '계산 정확성', value: sc, score: sc, status: st, text, skipped: !!c.skipped, helped: !!c.helped };
    }

    // ----- 해피 셰프가 보는 것: 창의성, 요리 이름, 도전 정신 -----
    const rareCount = foodRows.filter((r) => GG_RARE_IDS.includes(r.ing.id)).length;
    const spiceSauce = rows.filter((r) => ['spice', 'sauce'].includes(r.ing.cat)).length;
    const cr = recipe ? 0.7 : Math.min(1, 0.5 * Math.min(1, catCount / 5) + 0.3 * Math.min(1, (spiceSauce + rareCount) / 4) + 0.2 * Math.min(1, variety / 7));
    m.creative = { label: '창의성', value: cr, score: cr, status: cr >= 0.7 ? 'nice' : 'low',
      text: recipe ? '창의성: 세계의 요리에 도전했어요' : '창의성: 재료 ' + catCount + '종류, 특별한 재료·양념 ' + (spiceSauce + rareCount) + '가지' };
    const nm = String(extra.name || '').trim(), len = Array.from(nm).length;
    let nq = 0.5;
    if (len >= 3 && len <= 14) nq += 0.2; else if (len > 14) nq -= 0.1;
    const baseName = (n) => n.replace(/\(.*\)/, '');                                          // "(마른 것)" 같은 설명은 빼고 비교
    if (rows.some((r) => nm.includes(baseName(r.ing.name)))) nq += 0.15;                      // 재료 이름이 들어 있으면 가산
    if (GG_NAME_WORDS.some((w) => nm.includes(w))) nq += 0.15;                              // 맛있어 보이는 말이 들어 있으면 가산
    if (recipe) nq = 0.85;                                                                    // 실제 요리 도전은 이름이 정해져 있음
    nq = Math.max(0, Math.min(1, nq));
    m.nameq = { label: '요리 이름', value: nq, score: nq, status: nq >= 0.7 ? 'nice' : 'low', text: '요리 이름 "' + nm + '" (' + len + '글자)' };
    const bv = recipe ? 0.6 + 0.4 * ({ low: 1, mid: 0.6, high: 0.3 }[recipe.sure || 'high'])
                      : Math.min(1, 0.5 * Math.min(1, variety / 7) + 0.3 * Math.min(1, rareCount / 3) + 0.2);
    m.brave = { label: '도전 정신', value: bv, score: bv, status: bv >= 0.7 ? 'nice' : 'low',
      text: recipe ? '도전 정신: ' + recipe.name + '에 도전했어요!' : '도전 정신: 재료 ' + variety + '가지에 도전했어요' };

    // ----- 조리하기: 미니게임 실력과 조리 방법 -----
    if (extra.cook && extra.cook.steps) {
      const st = extra.cook.steps;
      const played = st.filter((x) => typeof x.score === 'number');
      if (played.length) {
        const avg = played.reduce((t, x) => t + x.score, 0) / played.length / 100;
        m.cook = { label: '조리 실력', value: Math.round(avg * 100), score: avg, status: avg >= 0.8 ? 'good' : 'low',
          text: '조리 실력 ' + Math.round(avg * 100) + '점 (' + played.map((x) => x.title + ' ' + x.score + '점').join(', ') + ')' };
      }
      const pick = st.find((x) => x.method && typeof x.methodScore === 'number');
      if (pick && !recipe) {
        m.method = { label: '조리 방법', value: pick.methodScore, score: pick.methodScore, status: pick.methodScore >= 0.7 ? 'good' : 'bad',
          text: '조리 방법 ' + pick.title + ': ' + (pick.methodNotes || []).join(' / ') + (pick.hinted ? ' (힌트를 봤어요)' : ''),
          broken: pick.methodBroken || [], hinted: !!pick.hinted };
      }
    }

    let recipeResult = null;
    if (recipe) {
      recipeResult = recipeMatch(rows, W, recipe);
      m.recipe = { label: '레시피 일치도', value: recipeResult.pct, score: recipeResult.total, status: recipeResult.pct >= 70 ? 'good' : 'low',
        text: '실제 ' + recipe.name + josa(recipe.name, '와', '과') + ' ' + recipeResult.pct + '% 비슷해요' };
    }

    return { type, W, count: rows.length, metrics: m, rows, recipe: recipeResult, budget, cost, cookSteps: (extra.cook && extra.cook.steps) || [] };
  }

  /** 점수대: 25점 만점 기준 */
  function tierOf(score) { return score >= 20 ? 'high' : score >= 12.5 ? 'mid' : 'low'; }

  /** 상황 목록 (이 요리에서 눈에 띄는 점들). 값은 "얼마나 심한가"(0~1): 클수록 셰프가 먼저 말해요 */
  function situationsOf(a) {
    const m = a.metrics, s = new Map();
    if (a.count < 2 || m.amount.status === 'low') s.set('notEnough', 1);
    if (m.combos.value > 0) s.set('weirdCombo', Math.min(1, 0.5 + 0.2 * m.combos.value));
    if (m.salt.status === 'high') s.set('tooSalty', 1 - m.salt.score);
    if (m.salt.status === 'low') s.set('tooBland', 1 - m.salt.score);
    if (m.sugar.status === 'high') s.set('tooSweet', 1 - m.sugar.score);
    if (m.oil.status === 'high') s.set('tooOily', 1 - m.oil.score);
    if (m.salt.status === 'good' && m.sugar.status === 'good' && m.balance.score >= 0.7) s.set('balanced', 0.01);
    if (m.variety.status === 'low' && a.count >= 2) s.set('lowVariety', 1 - m.variety.score);
    if (m.variety.status === 'high') s.set('tooMany', 0.5);
    if (m.main.score < 0.7) s.set('mainOff', 1 - m.main.score);
    if (m.fit.status === 'low') s.set('typeMismatch', 1 - m.fit.score);
    if (m.combos.value === 0 && m.variety.status === 'good' && m.main.score >= 0.7 && m.fit.status === 'good') s.set('wellMade', 0.05);
    if (m.price.status === 'high') s.set(a.budget ? 'overBudget' : 'pricey', Math.min(1, 0.4 + (1 - m.price.score)));
    else if (a.budget) s.set('budgetPerfect', 0.2);
    if (m.accuracy) {
      if (m.accuracy.skipped) s.set('calcSkipped', 0.8);
      else if (m.accuracy.score >= 0.9 && !m.accuracy.helped) s.set('calcExact', 0.25);
      else if (m.accuracy.score < 0.6) s.set('calcOff', 1 - m.accuracy.score);
    }
    if (m.nameq.score >= 0.85 && !a.recipe) s.set('nameGreat', 0.5);
    if (m.creative.score >= 0.75 && !a.recipe) s.set('boldMix', 0.4);
    if (m.brave.score >= 0.8) s.set('tryHard', 0.3);
    if (m.method) {
      if (m.method.broken.includes('raw')) s.set('rawFood', 1);
      else if (m.method.score < 0.6) s.set('methodWrong', 1 - m.method.score);
      if (m.method.hinted) s.set('hintUsed', 0.15);
    }
    if (m.cook) {
      if (m.cook.score >= 0.9) s.set('cookGreat', 0.35);
      else if (m.cook.score < 0.6) s.set('cookClumsy', 1 - m.cook.score);
    }
    if (a.recipe) {
      if (a.recipe.total >= 0.75) s.set('similarRecipe', 0.3);
      else if (a.recipe.total < 0.45) s.set('notSimilar', 1 - a.recipe.total);
    }
    return s;
  }

  /** 대사의 {dish} 자리에 요리 이름을 넣고, 바로 뒤의 조사(가/이, 를/을, 는/은, 와/과, 라는/이라는 등)를 받침에 맞게 고침 */
  const JOSA_PAIRS = [['이에요', '예요'], ['이라는', '라는'], ['이라고', '라고'], ['으로', '로'], ['이', '가'], ['을', '를'], ['은', '는'], ['과', '와']];   // [받침 있을 때, 없을 때]
  function fillDish(tpl, dish) {
    const c = dish.charCodeAt(dish.length - 1), isHangul = c >= 0xac00 && c <= 0xd7a3;
    const hasFinal = isHangul && (c - 0xac00) % 28 !== 0, isRieul = isHangul && (c - 0xac00) % 28 === 8;
    return tpl.replace(/{dish}(이에요|예요|이라는|라는|이라고|라고|으로|로|이|가|을|를|은|는|과|와)?/g, (m, p) => {
      if (!p) return dish;
      const pair = JOSA_PAIRS.find((x) => x.includes(p));
      if (!pair) return dish + p;
      if (pair[0] === '으로') return dish + (hasFinal && !isRieul ? '으로' : '로');
      return dish + (hasFinal ? pair[0] : pair[1]);
    });
  }

  /** 대사 고르기: 같은 점수대 안에서 가장 심한 상황의 대사를 먼저 찾고(같으면 셰프의 priority 순서), 없으면 그 점수대의 general 대사 */
  function pickLine(chef, tier, sits, dish) {
    const own = chef.lines[tier] || {};
    const order = chef.priority || [];
    const cands = [...sits.keys()].filter((k) => own[k] && own[k].length)
      .sort((x, y) => (sits.get(y) - sits.get(x)) || (order.indexOf(x) - order.indexOf(y)));
    let pool = cands.length ? own[cands[0]] : null;
    if (!pool) pool = (own.general && own.general.length) ? own.general : ['{dish}, 잘 먹겠습니다!'];
    return fillDish(pool[Math.floor(Math.random() * pool.length)], dish);
  }

  /** 심사하기: ready 인 셰프만 점수를 내고, 합산해서 100점 만점으로 환산 */
  function judge(items, typeId, dishName, recipe, extra) {
    const a = analyze(items, typeId, recipe, Object.assign({ name: dishName }, extra || {}));    // extra: { calc(계산 확인 답), budget(예산) }
    const sits = situationsOf(a);
    const chefs = GG_CHEFS.filter((c) => c.ready).map((chef) => {
      const used = chef.focus.filter((f) => a.metrics[f.metric]);
      const wSum = used.reduce((s, f) => s + f.weight, 0) || 1;
      let avg = used.reduce((s, f) => s + f.weight * a.metrics[f.metric].score, 0) / wSum;
      const worst = Math.min(...used.map((f) => a.metrics[f.metric].score));
      if (!chef.base) avg *= 0.7 + 0.3 * worst;                       // 중점 항목 중 가장 나쁜 것이 0점이면 30% 깎임 (소금 폭탄 같은 경우). 후한 셰프(base)는 제외
      avg *= Math.max(0.4, 1 - 0.2 * a.metrics.combos.value);          // 이상한 조합이 있으면 어느 셰프든 점수를 깎음 (1개당 20%)
      const base = chef.base || 0;
      const score = Math.round(25 * (base + (1 - base) * avg));
      const tier = tierOf(score);
      return { chef, score, tier, line: pickLine(chef, tier, sits, dishName), details: used.map((f) => a.metrics[f.metric]) };
    });
    const sum = chefs.reduce((s, c) => s + c.score, 0);
    const total = chefs.length ? Math.round(sum / (25 * chefs.length) * 100) : 0;
    const grade = GG_GRADES.find((g) => total >= g.min);
    return { analysis: a, chefs, total, grade, chefCount: chefs.length };
  }

  return { analyze, judge, tierOf };
})();
