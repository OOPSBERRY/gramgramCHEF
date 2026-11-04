/* 제출 화면과 결과 화면: 요리 종류, 이름 정하기 → 셰프가 한 명씩 등장해 점수와 한마디 → 합계 공개 */
(function () {
  const $ = (id) => document.getElementById(id);
  const A = window.GGApp;
  const BADGE = { good: ['알맞아요', 'good'], high: ['많아요', 'warn'], low: ['부족해요', 'warn'], bad: ['이상해요', 'bad'], nice: ['멋져요', 'good'] };
  let typeId = null;
  let lastRec = null;                // 방금 저장한 기록 (순위를 보여줄 때 씀)
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
      b.innerHTML = '<span class="n">' + t.name + '</span><span class="d">' + t.desc + '</span>';
      b.onclick = () => {
        typeId = t.id; $('sub-msg').textContent = '';
        box.querySelectorAll('.sub-type').forEach((x) => x.classList.toggle('on', x === b));
      };
      box.appendChild(b);
    });
    const items = A.state.items.filter((it) => it.amount > 0);
    const cost = GGCalc.totalCost(items), grams = GGCalc.totalGrams(items), bud = A.state.budget;
    $('sub-summary').innerHTML = '재료 <b>' + items.length + '가지</b> · 총 원가 <b>' + GGCalc.won(cost) + '</b> · 총 무게 <b>' + GGCalc.amountText(grams, 'g') + '</b>' +
      (bud === null ? '' : ' · 예산 ' + GGCalc.won(bud) + (cost > bud ? ' <b class="over">(초과!)</b>' : ' <b class="okay">(통과)</b>'));
    A.show('screen-submit');
  }

  function submit() {
    if (!typeId) { $('sub-msg').textContent = '요리 종류를 골라 주세요.'; return; }
    const name = $('sub-name').value.trim();
    const f = GGFilter.check(name);
    if (!f.ok) { $('sub-msg').textContent = f.msg; if (window.GGSound) GGSound.play('error'); return; }
    const items = A.state.items.filter((it) => it.amount > 0);
    askCalc(items, (calc) => startResult(GGJudge.judge(items, typeId, name, null, { calc, budget: A.state.budget }), name, items));
  }

  /* ================= 계산 확인 (그램 셰프의 질문) ================= */
  let calcUnit = 'g';
  function askCalc(items, done) {
    const gram = GG_CHEFS.find((c) => c.id === 'gram');
    const P = A.state.player;
    $('calc-avatar').innerHTML = gram ? chefSvg(gram) : '';
    $('calc-say').textContent = (P ? P.name + (P.type === 'team' ? ' 모둠' : '님') + ', ' : '') + '제출하기 전에 숫자를 확인해 볼까요? 아래 표의 재료를 모두 더하면 총 원가와 총 무게는 얼마일까요?';
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
  function chefSvg(chef) {
    const a = chef.avatar || {}, skin = a.skin || '#F2C29B', ink = '#3a2a1a';
    const brow = {
      angry: '<path d="M27 43 L44 50 M73 43 L56 50" />',
      flat:  '<path d="M29 46 H45 M55 46 H71" />',
      soft:  '<path d="M29 49 Q37 43 45 47 M55 47 Q63 43 71 49" />',
      happy: '<path d="M30 47 Q37 40 44 47 M56 47 Q63 40 70 47" />'
    }[a.brow] || '';
    const eyes = a.brow === 'happy'
      ? '<path d="M31 58 Q37 51 43 58 M57 58 Q63 51 69 58" fill="none" />'
      : '<circle cx="37" cy="58" r="3.6" fill="' + ink + '" stroke="none" /><circle cx="63" cy="58" r="3.6" fill="' + ink + '" stroke="none" />';
    const mouth = {
      shout: '<ellipse cx="50" cy="77" rx="9" ry="7" fill="#7a2a2a" stroke="' + ink + '" /><path d="M43 74 H57" stroke="#fff" stroke-width="3" />',
      line:  '<path d="M42 77 H58" />',
      smile: '<path d="M40 74 Q50 84 60 74" fill="none" />',
      grin:  '<path d="M37 72 Q50 90 63 72 Z" fill="#fff" />'
    }[a.mouth] || '';
    const extra = {
      glasses: '<circle cx="37" cy="58" r="9" fill="none" /><circle cx="63" cy="58" r="9" fill="none" /><path d="M46 58 H54" />',
      mustache: '<path d="M38 69 Q44 64 50 69 Q56 64 62 69" fill="' + ink + '" />',
      blush: '<circle cx="28" cy="68" r="5" fill="#ff8a7a" stroke="none" opacity=".55" /><circle cx="72" cy="68" r="5" fill="#ff8a7a" stroke="none" opacity=".55" />'
    }[a.extra] || '';
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<circle cx="50" cy="62" r="32" fill="' + skin + '" stroke="' + ink + '" stroke-width="2.5" />' +
      '<path d="M22 40 Q14 14 38 18 Q50 4 62 18 Q86 14 78 40 Z" fill="#fff" stroke="' + ink + '" stroke-width="2.5" stroke-linejoin="round" />' +
      '<rect x="22" y="36" width="56" height="9" rx="3" fill="' + chef.color + '" stroke="' + ink + '" stroke-width="2.5" />' +
      '<g stroke="' + ink + '" stroke-width="3" stroke-linecap="round" fill="none">' + brow + eyes + extra + mouth + '</g></svg>';
  }

  /* ================= 결과 화면 ================= */
  function countUp(el, to, ms, from) {
    from = from || 0;
    return new Promise((resolve) => {
      const t0 = performance.now();
      (function tick(now) {
        const p = Math.min(1, (now - t0) / ms);
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
      const b = BADGE[d.status] || BADGE.good;
      return '<li><span class="badge ' + b[1] + '">' + b[0] + '</span><span class="t">' + esc(d.text) + '</span></li>';
    }).join('');
  }

  function buildLeft(name, items, typeObj) {
    const R = A.state.mode === 'real' ? A.state.recipe : null;       // 실제 요리 도전이면 레시피 정보를 함께 보여줌
    const cost = GGCalc.totalCost(items), bud = A.state.budget;
    const chips = items.slice().sort((a, b) => GGCalc.grams(b.ing, b.amount) - GGCalc.grams(a.ing, a.amount)).slice(0, 8).map((it) =>
      '<div class="chip-ing"><span class="ph" data-id="' + it.ing.id + '"></span><span>' + esc(it.ing.name) + ' ' + GGCalc.amountText(it.amount, it.ing.unit) + '</span></div>').join('');
    $('res-left').innerHTML =
      '<div class="res-dishvisual" id="res-visual"></div>' +
      '<div class="res-dishname">' + esc(name) + '</div>' +
      '<div class="res-dishtype">' + (R ? R.country + ' · ' : '') + typeObj.name + ' · 재료 ' + items.length + '가지</div>' +
      (R ? '<div class="res-intro">' + esc(R.intro) + '</div>' : '') +
      '<div class="res-chips">' + chips + '</div>' +
      '<div class="res-cost">총 원가 <b>' + GGCalc.won(cost) + '</b>' +
      (bud === null ? '' : ' · 예산 ' + GGCalc.won(bud) + (cost > bud ? ' <b class="over">초과</b>' : ' <b class="okay">통과</b>')) + '</div>';
    // 재료 사진 칩과 대표 요리 그림 (사진이 없으면 이모지)
    $('res-left').querySelectorAll('.ph').forEach((p) => p.appendChild(A.photo(GG_INGREDIENTS.find((i) => i.id === p.dataset.id))));
    const vis = $('res-visual');
    const img = document.createElement('img');
    img.alt = ''; img.src = R ? 'assets/dishes/' + R.id + '.png' : 'assets/ui/dish-' + typeObj.id + '.png';
    img.onerror = () => { const e = document.createElement('div'); e.className = 'big-emoji'; e.textContent = typeObj.emoji; img.replaceWith(e); };
    vis.appendChild(img);
  }

  /** 점수 기록을 이 기기(localStorage)에 저장 */
  function saveRecord(result, name, items, typeObj) {
    const R = A.state.mode === 'real' ? A.state.recipe : null;
    const P = A.state.player || { type: 'solo', name: '이름 없음', members: [] };
    const rc = result.analysis.recipe;
    lastRec = GGStore.add({
      pType: P.type, pName: P.name, members: P.members || [], mode: A.state.mode,
      dish: name, dishId: R ? R.id : null, dtype: typeObj.id,
      total: result.total, chefCount: result.chefCount, chefScores: result.chefs.map((c) => ({ id: c.chef.id, score: c.score })),
      sim: rc ? rc.pct : null, cost: GGCalc.totalCost(items), budget: A.state.budget, items: items.map((it) => [it.ing.id, it.amount])
    });
  }

  async function startResult(result, name, items) {
    const my = ++run;
    const typeObj = result.analysis.type;
    buildLeft(name, items, typeObj);
    saveRecord(result, name, items, typeObj);
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
        '<div class="res-step">심사 ' + (i + 1) + ' / ' + result.chefs.length + '</div>' +
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
    showFinal(result);
  }

  function finalButtons() {
    return '<div class="res-final-btns">' +
      '<button class="res-btn ghost" id="btn-rank2">랭킹 보기</button>' +
      '<button class="res-btn ghost" id="btn-again">같은 재료로 다시 고치기</button>' +
      '<button class="res-btn" id="btn-new">' + (A.state.mode === 'real' ? '다른 요리 도전하기' : '새 요리 만들기') + '</button>' +
      '<button class="res-btn ghost" id="btn-home2">처음으로</button></div>';
  }
  function bindFinal() {
    $('btn-rank2').onclick = () => A.showRank(lastRec ? lastRec.pType : 'solo');
    $('btn-again').onclick = () => A.showKitchen();
    $('btn-new').onclick = () => (A.state.mode === 'real' ? A.showDishes() : A.newDish());
    $('btn-home2').onclick = () => A.show('screen-home');
  }

  /** 합계가 공개된 뒤: 높은 점수면 색종이와 팡파르, 아니면 부드러운 소리 */
  function celebrate(total) {
    if (window.GGSound) GGSound.play(total >= 75 ? 'good' : 'soft');
    if (total < 75) return;
    const box = document.createElement('div'); box.className = 'confetti';
    const colors = ['#E8590C', '#E3B04B', '#5E7F4F', '#2E86AB', '#C0392B'];
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

  async function showFinal(result) {
    const my = run;
    const all = Object.values(result.analysis.metrics);
    const names = result.chefs.map((c, i) => '<li style="--chef:' + c.chef.color + ';animation-delay:' + (i * 0.3) + 's"><span class="mini">' + chefSvg(c.chef) + '</span><span>' + esc(c.chef.name) + '</span><b>' + c.score + ' / 25</b></li>').join('');
    const ri = lastRec ? GGStore.rankInfo(lastRec) : null, team = lastRec && lastRec.pType === 'team';
    const rank = ri ? '<div class="final-rank">' + esc(lastRec.pName) + ' · ' + (team ? '모둠전' : '개인전') + ' 이번 점수는 <b>' + ri.rank + '위</b> (' + ri.of + (team ? '모둠' : '명') + ' 중)</div>' : '';
    const rc = result.analysis.recipe, R = A.state.mode === 'real' ? A.state.recipe : null;
    const sim = (rc && R)
      ? '<div class="final-sim"><div class="sim-big">실제 ' + esc(R.name) + josa(R.name) + ' <b>' + rc.pct + '%</b> 비슷해요</div>' +
        '<div class="sim-parts">필수 재료 ' + rc.reqPresent + '/' + rc.reqTotal + ' · 비율 일치도 ' + rc.parts.ratio + '% · 관계없는 재료 점수 ' + rc.parts.extra + '%</div>' +
        (rc.missing.length ? '<div class="sim-miss">빠진 재료: ' + rc.missing.map(esc).join(', ') + '</div>' : '') + '</div>' +
        '<details class="final-table"><summary>레시피와 비교해 보기 (숫자)</summary><ul class="checks">' + detailRows(rc.rows) + '</ul></details>'
      : '';
    const note = result.chefCount < GG_CHEFS.length
      ? '<div class="res-note">지금은 심사위원 ' + result.chefCount + '명이에요. ' + result.chefCount + '명의 점수를 100점 만점으로 바꿔서 보여줘요.</div>' : '';
    $('res-right').innerHTML =
      '<div class="res-step">최종 결과</div>' +
      '<div class="final-score"><span class="num" id="final-num">0</span><span class="unit">점</span></div>' +
      '<div class="final-grade">' + esc(result.grade.title) + '</div>' +
      '<div class="final-msg">' + esc(result.grade.msg) + '</div>' + rank + sim +
      '<ul class="final-chefs">' + names + '</ul>' + note +
      '<details class="final-table"><summary>내 요리 분석표 보기 (숫자)</summary><ul class="checks">' + detailRows(all) + '</ul></details>' +
      finalButtons();
    bindFinal();
    await wait(result.chefs.length * 300 + 400);                    // 셰프들의 점수가 차례로 나타난 뒤에 합계 공개
    if (my !== run) return;
    await countUp($('final-num'), result.total, 1600);
    if (my === run) celebrate(result.total);
    if (my === run) $('final-num').parentNode.classList.add('done');
  }

  /* ================= 연결 ================= */
  function submitReal() {
    const R = A.state.recipe;
    const items = A.state.items.filter((it) => it.amount > 0);
    if (!R || !items.length) return;
    askCalc(items, (calc) => startResult(GGJudge.judge(items, R.type, R.name, R, { calc, budget: A.state.budget }), R.name, items));
  }
  $('btn-submit').onclick = () => (A.state.mode === 'real' ? submitReal() : openSubmit());
  $('sub-cancel').onclick = () => A.show('screen-kitchen');
  $('sub-go').onclick = submit;
  $('sub-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
})();
