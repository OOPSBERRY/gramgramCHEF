/* 제출 화면과 결과 화면: 요리 종류, 이름 정하기 → 셰프가 한 명씩 등장해 점수와 한마디 → 합계 공개 */
(function () {
  const $ = (id) => document.getElementById(id);
  const A = window.GGApp;
  /* 결과 줄 앞의 채점 표시: 선생님이 빨간 펜으로 채점하듯 ○ △ ✕ */
  const MARK = { good: ['o', '알맞아요', '○'], nice: ['o', '멋져요', '○'], high: ['tri', '많아요', '△'], low: ['tri', '부족해요', '△'], bad: ['x', '이상해요', '✕'] };
  let typeId = null;
  let run = 0;                       // 화면을 다시 열면 이전 연출이 멈추도록 하는 번호

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const josa = (w) => { const c = w.charCodeAt(w.length - 1); return (c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0) ? '과' : '와'; };   // 받침이 있으면 과, 없으면 와
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ================= 제출 화면 ================= */
  function openSubmit() {
    typeId = null;
    $('sub-name').value = ''; $('sub-msg').textContent = '';
    const box = $('sub-types'); box.innerHTML = '';
    GG_DISH_TYPES.forEach((t) => {
      const b = document.createElement('button');
      b.className = 'sub-type'; b.dataset.id = t.id;
      b.innerHTML = '<span class="n">' + t.name + '</span>';
      b.onclick = () => {
        typeId = t.id; $('sub-msg').textContent = '';
        box.querySelectorAll('.sub-type').forEach((x) => x.classList.toggle('on', x === b));
      };
      box.appendChild(b);
    });
    const items = A.state.items.filter((it) => it.amount > 0);
    const cost = GGCalc.totalCost(items), grams = GGCalc.totalGrams(items), bud = A.state.budget;
    $('sub-summary').innerHTML = '재료 <b>' + items.length + '가지</b>, 총 원가 <b>' + GGCalc.won(cost) + '</b>, 총 무게 <b>' + GGCalc.amountText(grams, 'g') + '</b>' +
      (bud === null ? '' : ', 예산 ' + GGCalc.won(bud) + (cost > bud ? ' <b class="over">(초과)</b>' : ' <b class="okay">(통과)</b>'));
    A.show('screen-submit');
  }

  function submit() {
    if (!typeId) { $('sub-msg').textContent = '요리 종류를 골라 주세요.'; return; }
    const name = $('sub-name').value.trim();
    const f = GGFilter.check(name);
    if (!f.ok) { $('sub-msg').textContent = f.msg; if (window.GGSound) GGSound.play('error'); return; }
    const items = A.state.items.filter((it) => it.amount > 0);
    GGCook.start(items, { typeId, name }, (cook) =>
      askCalc(items, (calc) => startResult(GGJudge.judge(items, typeId, name, null, { calc, cook, budget: A.state.budget }), name, items)));
  }

  /* ================= 계산 확인 (그램 셰프의 질문) ================= */
  let calcUnit = 'g';
  function askCalc(items, done) {
    const gram = GG_CHEFS.find((c) => c.id === 'gram');
    $('calc-avatar').innerHTML = gram ? chefSvg(gram) : '';
    $('calc-say').textContent = '제출하기 전에 숫자를 확인해 볼까요? 아래 표의 재료를 모두 더하면 총 원가와 총 무게는 얼마일까요?';
    // 재료표: 원가와 무게(g). mL 재료는 g으로 바꿔서 보여줌
    let rows = '';
    items.forEach((it) => {
      const g = Math.round(GGCalc.grams(it.ing, it.amount));
      rows += '<tr><td>' + esc(it.ing.name) + '</td><td>' + GGCalc.amountText(it.amount, it.ing.unit) + '</td><td>' + g.toLocaleString('ko-KR') + 'g</td><td>' + GGCalc.cost(it.ing, it.amount).toLocaleString('ko-KR') + '원</td></tr>';
    });
    $('calc-table').innerHTML = '<table><thead><tr><th>재료</th><th>양</th><th>g으로 바꾸면</th><th>원가</th></tr></thead><tbody>' + rows + '</tbody></table>';
    const trueCost = GGCalc.totalCost(items), trueG = Math.round(GGCalc.totalGrams(items));
    $('calc-cost').value = ''; $('calc-weight').value = ''; calcUnit = 'g';
    $('calc-answer').hidden = true; $('calc-msg').textContent = '';
    let helped = false;
    const syncUnit = () => document.querySelectorAll('#calc-units button').forEach((b) => b.classList.toggle('on', b.dataset.u === calcUnit));
    syncUnit();
    document.querySelectorAll('#calc-units button').forEach((b) => { b.onclick = () => { calcUnit = b.dataset.u; syncUnit(); }; });
    $('calc-help').onclick = () => {
      helped = true;
      $('calc-answer').hidden = false;
      $('calc-answer').innerHTML = '정답은 총 원가 <b>' + GGCalc.won(trueCost) + '</b>, 총 무게 <b>' + trueG.toLocaleString('ko-KR') + 'g</b> (' + GGCalc.amountText(trueG, 'g') + ')이에요. 도움을 받으면 계산 점수가 줄어들어요.';
      $('calc-cost').value = trueCost; calcUnit = 'g'; syncUnit(); $('calc-weight').value = trueG;
    };
    $('calc-skip').onclick = () => done({ skipped: true });
    $('calc-back').onclick = () => A.show('screen-kitchen');
    $('calc-go').onclick = () => {
      const c = parseFloat($('calc-cost').value), w = parseFloat($('calc-weight').value);
      if (!isFinite(c) || !isFinite(w) || c < 0 || w < 0) { $('calc-msg').textContent = '총 원가와 총 무게를 모두 적어 주세요. (모르겠으면 건너뛰기를 눌러요)'; return; }
      done({ cost: c, grams: calcUnit === 'kg' ? w * 1000 : w, helped });
    };
    A.show('screen-calc');
  }

  /* ================= 셰프 얼굴 (직접 그린 오리지널 캐릭터) ================= */
  /* 셰프 얼굴: 연필로 스케치한 느낌 (흔들리는 선 + 겹쳐 그은 선 + 빗금 그림자). 색은 design-rules.css 변수 */
  let sketchId = 0;
  function chefSvg(chef) {
    const a = chef.avatar || {}, id = 'pc' + (++sketchId);
    const brow = {
      angry: 'M27 43 L44 50 M73 43 L56 50',
      flat:  'M29 46 H45 M55 46 H71',
      soft:  'M29 49 Q37 43 45 47 M55 47 Q63 43 71 49',
      happy: 'M30 47 Q37 40 44 47 M56 47 Q63 40 70 47'
    }[a.brow] || '';
    const eyes = a.brow === 'happy' ? 'M31 58 Q37 51 43 58 M57 58 Q63 51 69 58' : '';
    const dots = a.brow === 'happy' ? '' : '<circle cx="37" cy="58" r="2.8" class="pc-fill"/><circle cx="63" cy="58" r="2.8" class="pc-fill"/>';
    const mouth = { shout: 'M41 73 Q50 86 59 73 Q50 70 41 73 Z', line: 'M42 77 Q50 78 58 76', smile: 'M40 74 Q50 84 60 74', grin: 'M37 72 Q50 90 63 72 Q50 75 37 72 Z' }[a.mouth] || '';
    const extra = {
      glasses: 'M28 58 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M54 58 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M46 58 H54',
      mustache: 'M38 69 Q44 63 50 68 Q56 63 62 69 Q56 71 50 69 Q44 71 38 69',
      blush: 'M24 67 l6 -4 M26 71 l6 -4 M68 67 l6 -4 M70 71 l6 -4'
    }[a.extra] || '';
    const lines = 'M50 30 m-32 32 a32 32 0 1 0 64 0 a32 32 0 1 0 -64 0' +                         // 얼굴
      ' M22 40 Q14 14 38 18 Q50 4 62 18 Q86 14 78 40 Z' +                                              // 모자
      ' M22 36 H78 V45 H22 Z' +                                                                        // 모자 띠
      ' M44 22 Q46 30 44 36 M58 20 Q56 28 58 36' +                                                     // 모자 주름
      ' ' + brow + ' ' + eyes + ' ' + mouth + ' ' + extra;
    const hatch = '<path class="pc-hatch" d="M26 50 l8 -6 M28 54 l10 -7 M66 50 l8 -6 M64 54 l10 -7 M36 88 l10 -6 M44 92 l12 -8 M54 92 l10 -7"/>' +
      '<path class="pc-band" d="M26 44 l6 -8 M33 44 l6 -8 M40 44 l6 -8 M47 44 l6 -8 M54 44 l6 -8 M61 44 l6 -8 M68 44 l6 -8 M75 44 l3 -4" style="stroke:' + chef.color + '"/>';
    return '<svg class="sketch" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs><filter id="' + id + '" x="-10%" y="-10%" width="120%" height="120%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="' + (sketchId % 7 + 1) + '" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G"/></filter></defs>' +
      '<g filter="url(#' + id + ')">' + hatch +
      '<path class="pc-line" d="' + lines + '"/>' +
      '<path class="pc-line pc-again" d="' + lines + '" transform="translate(.8 -.6) rotate(.6 50 50)"/>' + dots + '</g></svg>';
  }


  /* ================= 결과 화면 ================= */
  function countUp(el, to, ms, from) {
    from = from || 0;
    return new Promise((resolve) => {
      const t0 = performance.now();
      (function tick(now) {
        const p = Math.max(0, Math.min(1, (now - t0) / ms));      // 첫 프레임 시각이 시작보다 살짝 앞설 수 있어서 0 아래로 내려가지 않게
        el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick); else resolve();
      })(t0);
    });
  }

  async function typeText(el, text, my) {
    el.textContent = '';
    for (let i = 0; i < text.length; i++) {
      if (my !== run) return;
      el.textContent += text[i];
      await wait(text[i] === ' ' ? 10 : 28);
    }
  }

  function detailRows(list) {
    return list.map((d) => {
      const mark = MARK[d.status] || MARK.good;
      const t = String(d.text), i = t.indexOf(' (알맞은 범위 ');                // 알맞은 범위는 작은 글씨로 따로
      const main = i >= 0 ? t.slice(0, i) : t;
      const sub = i >= 0 ? t.slice(i + 2, t.lastIndexOf(')')) + t.slice(t.lastIndexOf(')') + 1) : '';
      return '<li><span class="mark ' + mark[0] + '" aria-label="' + mark[1] + '">' + mark[2] + '</span><span class="t">' + esc(main) +
        (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span></li>';
    }).join('');
  }

  /* 창작 요리: 은빛 뚜껑(클로슈)을 덮은 접시. 안에 무엇이 있는지는 학생 상상에 맡겨요 */
  const CLOCHE =
    '<svg class="cloche" viewBox="0 0 400 300" aria-hidden="true">' +
    '<g class="steam"><path d="M150 70 q-14 -22 0 -44 q14 -22 0 -44"/><path d="M200 60 q-14 -22 0 -44 q14 -22 0 -44"/><path d="M250 70 q-14 -22 0 -44 q14 -22 0 -44"/></g>' +
    '<ellipse class="plate" cx="200" cy="262" rx="190" ry="30"/>' +
    '<ellipse class="plate-in" cx="200" cy="256" rx="150" ry="18"/>' +
    '<g class="lid"><path class="dome" d="M48 252 Q48 92 200 92 Q352 92 352 252 Z"/>' +
    '<path class="shine" d="M92 214 Q96 136 168 116"/>' +
    '<rect class="rim" x="36" y="244" width="328" height="16" rx="8"/>' +
    '<circle class="knob" cx="200" cy="80" r="16"/></g>' +
    '</svg>';

  function buildLeft(name, items, typeObj) {
    const R = A.state.mode === 'real' ? A.state.recipe : null;       // 실제 요리 도전이면 레시피 정보를 함께 보여줌
    const cost = GGCalc.totalCost(items), bud = A.state.budget;
    const chips = items.slice().sort((a, b) => GGCalc.grams(b.ing, b.amount) - GGCalc.grams(a.ing, a.amount)).slice(0, 8).map((it) =>
      '<div class="chip-ing"><span class="ph" data-id="' + it.ing.id + '"></span><span>' + esc(it.ing.name) + ' ' + GGCalc.amountText(it.amount, it.ing.unit) + '</span></div>').join('');
    $('res-left').innerHTML =
      '<div class="res-dishvisual" id="res-visual"></div>' +
      (R ? '<div class="res-dishname">' + esc(name) + '</div>' : '') +
      '<div class="res-dishtype">' + (R ? R.country + ' 요리, ' : '') + typeObj.name + ', 재료 ' + items.length + '가지</div>' +
      (R ? '<div class="res-intro">' + esc(R.intro) + '</div>' : '') +
      '<div class="res-chips">' + chips + '</div>' +
      '<div class="res-cost">총 원가 <b>' + GGCalc.won(cost) + '</b>' +
      (bud === null ? '' : ', 예산 ' + GGCalc.won(bud) + (cost > bud ? ' <b class="over">초과</b>' : ' <b class="okay">통과</b>')) + '</div>';
    // 재료 사진 칩과 대표 요리 그림 (사진이 없으면 이모지)
    $('res-left').querySelectorAll('.ph').forEach((p) => p.appendChild(A.photo(GG_INGREDIENTS.find((i) => i.id === p.dataset.id))));
    const vis = $('res-visual');
    if (!R) {                                                          // 창작 요리: 뚜껑 덮인 접시 + 학생이 지은 이름표
      vis.innerHTML = CLOCHE;
      const tag = document.createElement('div'); tag.className = 'res-nametag'; tag.textContent = name;
      vis.appendChild(tag);
      return;
    }
    const img = document.createElement('img');
    img.alt = ''; img.src = 'assets/dishes/' + R.id + '.png';
    img.onerror = () => { const e = document.createElement('div'); e.className = 'big-emoji'; e.textContent = typeObj.emoji; img.replaceWith(e); };
    vis.appendChild(img);
  }

  async function startResult(result, name, items) {
    const my = ++run;
    const typeObj = result.analysis.type;
    buildLeft(name, items, typeObj);
    A.show('screen-result');
    const right = $('res-right');

    if (!result.chefCount) {
      right.innerHTML = '<div class="res-empty">심사할 셰프가 아직 없어요.<br>data/chefs.js 에서 셰프의 ready 를 true 로 바꿔 주세요.</div>' + finalButtons();
      bindFinal(); return;
    }

    for (let i = 0; i < result.chefs.length; i++) {
      if (my !== run) return;
      const c = result.chefs[i], last = i === result.chefs.length - 1;
      const running = result.chefs.slice(0, i).reduce((s, x) => s + x.score, 0);        // 앞 셰프들의 점수 합
      right.innerHTML =
        '<div class="res-running">지금까지 합계 <b id="run-num">' + running + '</b> / ' + (25 * (i + 1)) + '점</div>' +
        '<div class="chef-card" style="--chef:' + c.chef.color + '">' +
        '<div class="chef-avatar">' + chefSvg(c.chef) + '</div>' +
        '<div class="chef-info"><div class="chef-name">' + esc(c.chef.name) + '</div><div class="chef-trait">' + esc(c.chef.trait) + '</div></div>' +
        '<div class="chef-score"><span class="num" id="chef-num">0</span><span class="max"> / 25</span></div></div>' +
        '<div class="bubble"><span id="bubble-text"></span></div>' +
        '<ul class="checks" id="checks" hidden>' + detailRows(c.details) + '</ul>' +
        '<div class="res-next"><button class="res-btn" id="btn-next" hidden>' + (last ? '합계 점수 보기' : '다음 셰프') + '</button></div>';
      await typeText($('bubble-text'), c.line, my);
      if (my !== run) return;
      if (window.GGSound) GGSound.play('ding');
      await countUp($('chef-num'), c.score, 900);
      if (my !== run) return;
      await countUp($('run-num'), running + c.score, 600, running);       // 합계에 더해지는 연출
      if (my !== run) return;
      $('checks').hidden = false;
      $('btn-next').hidden = false;
      await new Promise((resolve) => { $('btn-next').onclick = resolve; });
    }
    if (my !== run) return;
    showFinal(result, name, items);
  }

  function finalButtons() {
    return '<div class="res-final-btns">' +
      '<button class="res-btn ghost" id="btn-again">같은 재료로 다시 고치기</button>' +
      '<button class="res-btn" id="btn-new">' + (A.state.mode === 'real' ? '다른 요리 도전하기' : '새 요리 만들기') + '</button>' +
      '<button class="res-btn ghost" id="btn-home2">처음으로</button></div>';
  }
  function bindFinal() {
    $('btn-again').onclick = () => A.showKitchen();
    $('btn-new').onclick = () => (A.state.mode === 'real' ? A.showDishes() : A.newDish());
    $('btn-home2').onclick = () => A.show('screen-home');
  }

  /** 합계가 공개된 뒤: 높은 점수면 색종이와 팡파르, 아니면 부드러운 소리 */
  function celebrate(total) {
    if (window.GGSound) GGSound.play(total >= 75 ? 'good' : 'soft');
    if (total < 75) return;
    const box = document.createElement('div'); box.className = 'confetti';
    const cssVar = (n, d) => (getComputedStyle(document.documentElement).getPropertyValue(n).trim() || d);
    const colors = [cssVar('--c-main', '#CF6830'), cssVar('--c-gold', '#E3B04B'), cssVar('--c-green', '#5E7F4F'), '#2E86AB', '#C0392B'];
    const n = total >= 90 ? 60 : 36;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%'; p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px'); p.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      p.style.animationDuration = (2.2 + Math.random() * 1.8) + 's'; p.style.animationDelay = (Math.random() * 0.6) + 's';
      box.appendChild(p);
    }
    $('screen-result').appendChild(box);
    setTimeout(() => box.remove(), 5000);
  }

  /* 최종 결과: 손으로 쓴 레시피 카드 한 장 (요리 이름, 점수 도장, 재료와 양, 만드는 순서, 셰프 한마디) */
  async function showFinal(result, name, items) {
    const my = run;
    const all = Object.values(result.analysis.metrics);
    const rc = result.analysis.recipe, R = A.state.mode === 'real' ? A.state.recipe : null;
    const typeObj = result.analysis.type;
    const ing = (items || []).slice().sort((a, b) => GGCalc.grams(b.ing, b.amount) - GGCalc.grams(a.ing, a.amount))
      .map((it) => '<li><span>' + esc(it.ing.name) + '</span><i></i><b>' + GGCalc.amountText(it.amount, it.ing.unit) + '</b></li>').join('');
    const steps = (result.analysis.cookSteps || []).filter((x) => GG_COOK_GAMES[x.game])
      .map((x) => '<li>' + esc(GG_COOK_GAMES[x.game].name) + (typeof x.score === 'number' ? ' <small>' + x.score + '점</small>' : '') + '</li>').join('');
    const chefs = result.chefs.map((c) => '<li style="--chef:' + c.chef.color + '"><span class="mini">' + chefSvg(c.chef) + '</span>' +
      '<div><b>' + esc(c.chef.name) + ' ' + c.score + '점</b><p>' + esc(c.line) + '</p></div></li>').join('');
    const sim = (rc && R)
      ? '<div class="rc-sim">실제 ' + esc(R.name) + josa(R.name) + ' <b>' + rc.pct + '%</b> 비슷해요' +
        (rc.missing.length ? '<span class="miss">빠진 재료: ' + rc.missing.map(esc).join(', ') + '</span>' : '') + '</div>'
      : '';
    const cost = GGCalc.totalCost(items || []);
    $('res-right').innerHTML =
      '<article class="recipe-card">' +
      '  <header class="rc-head"><div><h2>' + esc(name) + '</h2>' +
      '    <div class="rc-sub">' + (R ? esc(R.country) + ' 요리, ' : '') + esc(typeObj.name) + ', 재료 ' + (items || []).length + '가지, 원가 ' + GGCalc.won(cost) + '</div></div>' +
      '    <div class="rc-stamp" id="rc-stamp"><span class="n" id="final-num">0</span><span class="u">점</span><span class="g">' + esc(result.grade.title) + '</span></div></header>' +
      '  <p class="rc-msg">' + esc(result.grade.msg) + '</p>' + sim +
      '  <div class="rc-cols"><section><h3>재료</h3><ul class="rc-ing">' + ing + '</ul></section>' +
      (steps ? '<section><h3>만드는 순서</h3><ol class="rc-steps">' + steps + '</ol></section>' : '') + '</div>' +
      '  <section><h3>셰프 한마디</h3><ul class="rc-chefs">' + chefs + '</ul></section>' +
      '</article>' +
      (rc && R ? '<details class="final-table"><summary>레시피와 비교해 보기 (숫자)</summary><ul class="checks">' + detailRows(rc.rows) + '</ul></details>' : '') +
      '<details class="final-table"><summary>내 요리 분석표 보기 (숫자)</summary><ul class="checks">' + detailRows(all) + '</ul></details>' +
      finalButtons();
    bindFinal();
    await wait(500);
    if (my !== run) return;
    await countUp($('final-num'), result.total, 1400);
    if (my !== run) return;
    $('rc-stamp').classList.add('done');
    celebrate(result.total);
  }

  /* ================= 연결 ================= */
  function submitReal() {
    const R = A.state.recipe;
    const items = A.state.items.filter((it) => it.amount > 0);
    if (!R || !items.length) return;
    GGCook.start(items, { typeId: R.type, name: R.name, recipe: R }, (cook) =>
      askCalc(items, (calc) => startResult(GGJudge.judge(items, R.type, R.name, R, { calc, cook, budget: A.state.budget }), R.name, items)));
  }
  $('btn-submit').onclick = () => (A.state.mode === 'real' ? submitReal() : openSubmit());
  $('sub-cancel').onclick = () => A.show('screen-kitchen');
  $('sub-go').onclick = submit;
  $('sub-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
})();
