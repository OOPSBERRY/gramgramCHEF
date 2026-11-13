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
    const cost = GGCalc.totalCost(items), bud = A.state.budget;          // 총 원가·총 무게는 계산 확인 화면에서 학생이 구하므로 여기서는 숨김
    $('sub-summary').innerHTML = '재료 <b>' + items.length + '가지</b>' +
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

  /** 소수 곱셈 문제를 하나씩 보여 주고, 맞히면 표의 ? 칸을 채움. 틀리면 맞힐 때까지 다시 */
  function runQuiz(quiz, items, show) {
    const box = $('calc-q');
    // 합계 적기(총 원가·총 무게)와 제출·정답 보기 버튼은 곱셈 문제를 다 맞힌 뒤에 열림
    const lock = (on) => { ['calc-totals', 'calc-go', 'calc-help'].forEach((id) => { $(id).hidden = on; }); };
    box.hidden = !quiz.length;
    lock(quiz.length > 0);
    if (!quiz.length) return;
    const KIND = { cost: '원가 계산', weight: '무게 계산' };
    let idx = 0;
    function render() {
      const q = quiz[idx];
      q.tries = q.tries || 0;
      box.classList.remove('done');
      $('cq-no').textContent = '문제 ' + (idx + 1) + ' / ' + quiz.length;
      $('cq-kind').textContent = KIND[q.kind];
      $('cq-ask').textContent = q.ask;
      $('cq-facts').innerHTML = q.facts.map((f) => '<li>' + esc(f) + '</li>').join('');
      $('cq-expr').textContent = GGCalcQuiz.num(q.a) + ' × ' + GGCalcQuiz.num(q.b) + ' =';
      $('cq-unit').textContent = q.unit;
      $('cq-input').value = ''; $('cq-input').disabled = false; $('cq-check').disabled = false;
      $('cq-msg').textContent = ''; $('cq-msg').className = 'cq-msg';
      $('cq-hint').hidden = true; $('cq-work').hidden = true; $('cq-work').innerHTML = '';
    }
    /** 세로셈 풀이를 칸 맞춘 표로 (손글씨 글꼴은 글자 폭이 달라서 한 글자씩 칸에 넣음) */
    function workHtml(q) {
      const v = GGCalcQuiz.vertical(q), P = v.PLACE, N = GGCalcQuiz.num;
      const lines = [{ s: String(v.top) }, { s: String(v.bottom), op: '×' }, { rule: true }];
      v.rows.forEach((r) => lines.push({ s: String(r.value), shift: r.shift }));
      if (v.rows.length) lines.push({ rule: true });
      lines.push({ s: String(v.product), strong: true });
      const W = 1 + Math.max(...lines.filter((l) => l.s).map((l) => l.s.length + (l.shift || 0)));
      const table = lines.map((l) => {
        if (l.rule) return '<tr class="rule"><td colspan="' + W + '"></td></tr>';
        const cells = (l.s + ' '.repeat(l.shift || 0)).padStart(W - 1, ' ').split('');
        return '<tr' + (l.strong ? ' class="strong"' : '') + '><td>' + (l.op || '') + '</td>' +
          cells.map((c) => '<td>' + (c === ' ' ? '' : c) + '</td>').join('') + '</tr>';
      }).join('');
      let steps = '<li>소수점을 떼고' + (v.zeros ? ', 끝의 0도 잠시 떼고' : '') + ' ' + v.top + ' × ' + v.bottom + ' = ' + v.product + '</li>';
      if (v.zeros) steps += '<li>떼어 둔 0 ' + v.zeros + '개를 붙이면 ' + v.joined + '</li>';
      // 소수점 찍기: 3750 → 375.0 (= 375). 앞에 0이 필요하면 채움 (206 → 0.206)
      const digits = String(v.joined).padStart(v.dp + 1, '0'), dotted = digits.slice(0, digits.length - v.dp) + '.' + digits.slice(digits.length - v.dp);
      steps += '<li>' + '두 수(' + N(q.a) + ', ' + N(q.b) + ')의 소수 자리 수를 더하면 ' + P[v.dp] + ' 자리 → ' + dotted +
        (dotted !== N(v.answer) ? ' = <b>' + N(v.answer) + '</b>' : '') + '</li>';
      return '<div class="cq-work-title">그램 셰프의 풀이</div><div class="cq-work-body"><table class="cq-vert">' + table + '</table><ol>' + steps + '</ol></div>';
    }
    function fill(q) {
      const i = items.indexOf(q.item), cell = $('cq-cell-' + i + '-' + q.kind);
      if (!cell) return;
      cell.textContent = q.kind === 'cost' ? show(q.answer) + '원' : show(GGCalc.grams(q.item.ing, q.item.amount)) + 'g';
      cell.classList.add('cq-solved');
    }
    function check() {
      const q = quiz[idx], text = $('cq-input').value;
      if (!isFinite(GGCalcQuiz.parse(text))) { $('cq-msg').textContent = '숫자로 답을 적어 주세요.'; $('cq-msg').className = 'cq-msg bad'; return; }
      q.tries++;
      if (!GGCalcQuiz.isRight(q, text)) {
        if (window.GGSound) GGSound.play('error');
        // 틀린 숫자를 보고 어떤 실수였는지 짐작해 힌트를 줌. 모르는 실수면 어림하기 → 소수점 규칙 순서로
        q.generic = q.generic || 0;
        const h = GGCalcQuiz.diagnose(q, text, q.generic);
        if (h.kind === 'unknown') q.generic++;
        (q.mistakes = q.mistakes || []).push(h.kind);
        $('cq-msg').textContent = '앗, 다시 계산해 볼까? (' + q.tries + '번 틀렸어요)';
        $('cq-msg').className = 'cq-msg bad';
        $('cq-hint').textContent = h.text; $('cq-hint').hidden = false;
        if (q.tries >= 3 && $('cq-work').hidden) { $('cq-work').innerHTML = workHtml(q); $('cq-work').hidden = false; }
        $('cq-input').select();
        return;
      }
      $('cq-hint').hidden = true;
      q.solved = true;
      if (window.GGSound) GGSound.play('ding');
      fill(q);
      $('cq-msg').textContent = '정답! ' + GGCalcQuiz.num(q.a) + ' × ' + GGCalcQuiz.num(q.b) + ' = ' + GGCalcQuiz.num(q.answer) + q.unit;
      $('cq-msg').className = 'cq-msg good';
      $('cq-input').disabled = true; $('cq-check').disabled = true;
      setTimeout(() => {
        if (idx < quiz.length - 1) { idx++; render(); $('cq-input').focus(); return; }
        box.classList.add('done');
        $('cq-msg').textContent = '문제를 모두 풀었어요! 표의 ? 칸이 모두 채워졌어요.';
        lock(false);
        $('calc-cost').focus();
        $('calc-say').textContent = '다 맞혔어! 이제 표의 숫자를 모두 더해서 총 원가와 총 무게를 적어 봐.';
      }, 1100);
    }
    $('cq-check').onclick = check;
    $('cq-input').onkeydown = (e) => { if (e.key === 'Enter') check(); };
    render();
  }

  function askCalc(items, done) {
    const gram = GG_CHEFS.find((c) => c.id === 'gram');
    $('calc-avatar').innerHTML = gram ? chefSvg(gram) : '';
    // 그램 셰프의 소수 곱셈 문제 (학생이 넣은 재료 중 2~3개). 문제로 나온 칸은 표에서 ? 로 가려 둠
    const quiz = GGCalcQuiz.build(items);
    const hidden = new Map();                                   // 재료 → { cost: 문제, weight: 문제 }
    quiz.forEach((q) => { const h = hidden.get(q.item) || {}; h[q.kind] = q; hidden.set(q.item, h); });
    $('calc-say').textContent = quiz.length
      ? '네가 넣은 재료로 문제를 냈어! 소수의 곱셈으로 표의 ? 칸을 채워 볼까?'
      : '제출하기 전에 숫자를 확인해 볼까요? 아래 표의 재료를 모두 더하면 총 원가와 총 무게는 얼마일까요?';
    // 재료표: 원가와 무게(g). mL 재료는 g으로 바꿔서 보여줌 (소수 그대로)
    const show = (n) => GGCalcQuiz.fix(n).toLocaleString('ko-KR', { maximumFractionDigits: 3 });
    let rows = '';
    items.forEach((it, i) => {
      const h = hidden.get(it) || {};
      const gCell = h.weight ? '<td class="cq-hole" id="cq-cell-' + i + '-weight">?</td>' : '<td>' + show(GGCalc.grams(it.ing, it.amount)) + 'g</td>';
      const cCell = h.cost ? '<td class="cq-hole" id="cq-cell-' + i + '-cost">?</td>' : '<td>' + show(it.amount * it.ing.price / 100) + '원</td>';
      rows += '<tr><td>' + esc(it.ing.name) + '</td><td>' + GGCalc.amountText(it.amount, it.ing.unit) + '</td>' + gCell + cCell + '</tr>';
    });
    $('calc-table').innerHTML = '<table><thead><tr><th>재료</th><th>양</th><th>g으로 바꾸면</th><th>원가</th></tr></thead><tbody>' + rows + '</tbody></table>';
    runQuiz(quiz, items, show);
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
  /* 셰프 표정 (점수를 듣고 바뀌는 얼굴)
     joy  : 기뻐요 (웃는 눈, 활짝 웃는 입, 반짝)      hmm : 갸웃해요 (일자 눈썹, 삐뚤한 입, 물음표)
     rage : 버럭해요 (화난 눈썹, 소리치는 입, 김)       sad : 아쉬워해요 (처진 눈썹, 내려간 입, 땀방울) */
  const MOODS = {
    joy:  { brow: 'happy', eyes: 'happy', mouth: 'grin', marks: 'M12 22 l5 5 M17 22 l-5 5 M84 18 l5 5 M89 18 l-5 5 M90 34 l3 3 M93 34 l-3 3' },
    hmm:  { brow: 'flat', mouth: 'wavy', marks: 'M84 20 q0 -6 5 -6 q5 0 5 5 q0 4 -5 5 v4 M89 33 v.1' },
    rage: { brow: 'angry', mouth: 'shout', marks: 'M10 34 q-5 -6 0 -12 q5 -6 0 -12 M90 34 q5 -6 0 -12 q-5 -6 0 -12 M80 50 l6 -2 M82 54 l6 0 M80 58 l6 2' },
    sad:  { brow: 'sad', mouth: 'frown', marks: 'M84 46 q5 9 0 12 q-5 -3 0 -12' }
  };
  /** 점수대에 맞는 표정 (버럭 셰프는 낮은 점수에 버럭, 해피 셰프는 웬만하면 기뻐함) */
  function moodOf(chef, tier) {
    if (tier === 'high') return 'joy';
    if (tier === 'mid') return chef.id === 'happy' ? 'joy' : 'hmm';
    return chef.id === 'bureok' ? 'rage' : 'sad';
  }

  function chefSvg(chef, mood) {
    const base = chef.avatar || {}, m = MOODS[mood] || {}, id = 'pc' + (++sketchId);
    const a = { brow: m.brow || base.brow, mouth: m.mouth || base.mouth, extra: base.extra, eyes: m.eyes };
    const brow = {
      angry: 'M27 43 L44 50 M73 43 L56 50',
      flat:  'M29 46 H45 M55 46 H71',
      soft:  'M29 49 Q37 43 45 47 M55 47 Q63 43 71 49',
      happy: 'M30 47 Q37 40 44 47 M56 47 Q63 40 70 47',
      sad:   'M29 50 Q37 48 45 44 M71 50 Q63 48 55 44'
    }[a.brow] || '';
    const happyEyes = a.eyes === 'happy' || (!mood && a.brow === 'happy');
    const eyes = happyEyes ? 'M31 58 Q37 51 43 58 M57 58 Q63 51 69 58' : '';
    const dots = happyEyes ? '' : '<circle cx="37" cy="58" r="2.8" class="pc-fill"/><circle cx="63" cy="58" r="2.8" class="pc-fill"/>';
    const mouth = { shout: 'M41 73 Q50 86 59 73 Q50 70 41 73 Z', line: 'M42 77 Q50 78 58 76', smile: 'M40 74 Q50 84 60 74', grin: 'M37 72 Q50 90 63 72 Q50 75 37 72 Z',
      wavy: 'M41 77 Q45 74 50 77 T59 76', frown: 'M41 80 Q50 72 59 80' }[a.mouth] || '';
    const extra = {
      glasses: 'M28 58 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M54 58 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M46 58 H54',
      mustache: 'M38 69 Q44 63 50 68 Q56 63 62 69 Q56 71 50 69 Q44 71 38 69',
      blush: 'M24 67 l6 -4 M26 71 l6 -4 M68 67 l6 -4 M70 71 l6 -4'
    }[a.extra] || '';
    const lines = 'M50 30 m-32 32 a32 32 0 1 0 64 0 a32 32 0 1 0 -64 0' +                         // 얼굴
      ' M22 40 Q14 14 38 18 Q50 4 62 18 Q86 14 78 40 Z' +                                              // 모자
      ' M22 36 H78 V45 H22 Z' +                                                                        // 모자 띠
      ' M44 22 Q46 30 44 36 M58 20 Q56 28 58 36' +                                                     // 모자 주름
      ' ' + eyes + ' ' + mouth + ' ' + extra + ' ' + (m.marks || '');
    const hatch = '<path class="pc-hatch" d="M26 50 l8 -6 M28 54 l10 -7 M66 50 l8 -6 M64 54 l10 -7 M36 88 l10 -6 M44 92 l12 -8 M54 92 l10 -7"/>' +
      '<path class="pc-band" d="M26 44 l6 -8 M33 44 l6 -8 M40 44 l6 -8 M47 44 l6 -8 M54 44 l6 -8 M61 44 l6 -8 M68 44 l6 -8 M75 44 l3 -4" style="stroke:' + chef.color + '"/>';
    return '<svg class="sketch" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs><filter id="' + id + '" x="-10%" y="-10%" width="120%" height="120%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="' + (sketchId % 7 + 1) + '" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G"/></filter></defs>' +
      '<g filter="url(#' + id + ')">' + hatch +
      '<path class="pc-line" d="' + lines + '"/>' +
      '<path class="pc-line pc-again" d="' + lines + '" transform="translate(.8 -.6) rotate(.6 50 50)"/>' +
      '<path class="pc-line pc-brow" d="' + brow + '" transform="translate(0 4)"/>' + dots + '</g></svg>';   // 눈썹은 모자 띠에 가리지 않게 조금 아래로
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

  /** 셰프 얼굴을 표정으로 바꾸고 짧게 움직임 (기쁨: 통통, 버럭: 부르르, 아쉬움: 축) */
  function react(box, chef, mood) {
    if (!box) return;
    box.innerHTML = chefSvg(chef, mood);
    box.className = 'chef-avatar react-' + mood;
    if (mood === 'rage' && window.GGCook) GGCook.ui.buzz([60, 30, 60]);
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
        '<div class="chef-avatar" id="chef-face">' + chefSvg(c.chef) + '</div>' +
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
      react($('chef-face'), c.chef, moodOf(c.chef, c.tier));             // 점수를 말한 뒤 표정이 바뀜
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
    const chefs = result.chefs.map((c) => '<li style="--chef:' + c.chef.color + '"><span class="mini">' + chefSvg(c.chef, moodOf(c.chef, c.tier)) + '</span>' +
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
