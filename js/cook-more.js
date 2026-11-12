/* 굽기, 튀기기, 버무리기 미니게임
   굽기     : 재료 색이 날것 → 노릇노릇 → 탐으로 변해요. 노릇할 때 [뒤집기] (앞뒤 두 번)
   튀기기   : 기름 온도가 오르내릴 때 170~180℃에서 [넣기] → 노릇해지면 [건지기]
   버무리기 : 손가락으로 그릇 안을 동그랗게 돌려 골고루 섞기 */
(function () {
  const isSolid = (ing) => !['liquid', 'season', 'spice', 'oil', 'sauce'].includes(ing.cat);
  const solidsOf = (step) => { const s = step.items.filter((it) => isSolid(it.ing)); return s.length ? s : step.items; };

  /* 익힘 정도(0~100)에 맞춰 사진 색을 바꿈: 날것 → 노릇 → 탐 */
  function cookFilter(v) {
    const gold = Math.min(1, v / 70);
    const burn = Math.max(0, (v - 80) / 20);
    return 'sepia(' + (gold * 0.55) + ') saturate(' + (1 + gold * 0.4) + ') brightness(' + (1 - gold * 0.08 - burn * 0.6) + ')';
  }
  /* 익힘 막대 (가로) */
  function doneBar(zone) {
    return '<div class="dn-bar"><div class="dn-zone" style="left:' + zone[0] + '%;width:' + (zone[1] - zone[0]) + '%"></div>' +
      '<div class="dn-mark"></div><span class="l">날것</span><span class="m" style="left:' + (zone[0] + zone[1]) / 2 + '%">노릇노릇</span><span class="r">탐</span></div>';
  }
  function judgeDone(v, zone) {
    if (v >= zone[0] && v <= zone[1]) return ['perfect', '노릇노릇!', 100];
    if (v < zone[0]) return v >= zone[0] - 15 ? ['good', '조금 덜 익었어요', 70] : ['bad', '덜 익었어요!', 30];
    return v <= zone[1] + 10 ? ['good', '조금 진해요', 70] : ['bad', '탔어요!', 20];
  }
  function popWord(stage, text, kind) {
    const w = document.createElement('div'); w.className = 'crack-word ' + kind; w.textContent = text;
    stage.appendChild(w); setTimeout(() => w.remove(), 900);
  }
  function addPieces(box, items, n) {
    const pieces = [];
    items.slice(0, n).forEach((it) => {
      const d = document.createElement('div'); d.className = 'mx-piece';
      d.appendChild(window.GGApp.photo(it.ing)); box.appendChild(d); pieces.push(d);
    });
    return pieces;
  }

  /* ================= 굽기 ================= */
  GGCook.games.grill = function (stage, step, finish) {
    const G = GG_GRILL;
    const items = solidsOf(step);
    let side = 0, v = 0, t0 = 0, playing = false, busy = false;
    const results = [];

    stage.innerHTML =
      '<div class="heat-hud"></div>' +
      '<div class="gr-grill"><div class="gr-food"></div></div>' +
      doneBar(G.zone) +
      '<button class="pour-hold gr-btn">뒤집기</button>';
    const food = stage.querySelector('.gr-food');
    const mark = stage.querySelector('.dn-mark');
    addPieces(food, items, 4);

    function hud() { stage.querySelector('.heat-hud').textContent = (side === 0 ? '앞면' : side === 1 ? '뒷면' : (side + 1) + '번째 면') + ' 굽기 (' + (side + 1) + ' / ' + G.sides + ')'; }
    function frame() {
      if (!playing || !stage.isConnected) return;
      if (!busy) {
        v = Math.min(100, (performance.now() - t0) / 1000 / G.secToBurn * 100);
        mark.style.left = v + '%';
        food.style.filter = cookFilter(v);
        if (v >= 100) { flip(); }                                  // 끝까지 두면 타서 저절로 끝남
      }
      requestAnimationFrame(frame);
    }
    function flip() {
      if (!playing || busy) return;
      busy = true;
      const [kind, word, pts] = judgeDone(v, G.zone);
      results.push(pts);
      GGCook.ui.buzz(kind === 'bad' ? [60, 40, 60] : 30);
      if (window.GGSound) GGSound.play(kind === 'bad' ? 'error' : 'pop');
      popWord(stage, word, kind);
      food.classList.add('flip');
      setTimeout(() => {
        food.classList.remove('flip');
        side++;
        if (side >= G.sides) { end(); return; }
        v = 0; food.style.filter = cookFilter(0); mark.style.left = '0%';
        hud(); busy = false; t0 = performance.now();
      }, 900);
    }
    function end() {
      playing = false;
      const score = results.reduce((a, b) => a + b, 0) / results.length;
      const good = results.filter((p) => p === 100).length;
      GGCook.ui.feedback(stage, score, finish, G.sides + '면 중 ' + good + '면을 노릇노릇하게 구웠어요.');
    }
    const btn = stage.querySelector('.gr-btn');
    btn.onpointerdown = (e) => { e.preventDefault(); flip(); };
    btn.oncontextmenu = (e) => e.preventDefault();

    hud();
    GGCook.ui.intro(stage, '굽기', '재료 색이 <b>날것 → 노릇노릇 → 탐</b>으로 변해요.<br>아래 막대가 <b>초록 칸</b>에 왔을 때 [뒤집기]를 눌러요.<br>앞뒤 ' + G.sides + '번!', () => {
      playing = true; t0 = performance.now(); frame();
    });
  };

  /* ================= 튀기기 ================= */
  GGCook.games.fry = function (stage, step, finish) {
    const F = GG_FRY;
    const items = solidsOf(step);
    let phase = 'temp', t0 = 0, temp = F.low, v = 0, playing = false, busy = false;
    const results = [];

    stage.innerHTML =
      '<div class="heat-hud">기름 온도를 보고 넣어요</div>' +
      '<div class="fr-pot"><div class="fr-oil"></div><div class="fr-food"></div><div class="boil-bubbles fr-bubbles"></div></div>' +
      '<div class="fr-thermo"><div class="fr-best"></div><div class="fr-ok"></div><div class="fr-level"></div><div class="fr-read"></div></div>' +
      '<div class="fr-donewrap" hidden>' + doneBar(F.zone) + '</div>' +
      '<button class="pour-hold gr-btn">넣기</button>';
    const food = stage.querySelector('.fr-food');
    const level = stage.querySelector('.fr-level');
    const read = stage.querySelector('.fr-read');
    const btn = stage.querySelector('.gr-btn');
    const doneWrap = stage.querySelector('.fr-donewrap');
    const mark = stage.querySelector('.dn-mark');
    const bubbles = stage.querySelector('.fr-bubbles');
    const pct = (c) => (c - F.low) / (F.high - F.low) * 100;
    stage.querySelector('.fr-best').style.cssText = 'bottom:' + pct(F.best[0]) + '%;height:' + (pct(F.best[1]) - pct(F.best[0])) + '%';
    stage.querySelector('.fr-ok').style.cssText = 'bottom:' + pct(F.ok[0]) + '%;height:' + (pct(F.ok[1]) - pct(F.ok[0])) + '%';
    addPieces(food, items, 3);
    for (let i = 0; i < 12; i++) {
      const b = document.createElement('i');
      b.style.left = (10 + Math.random() * 80) + '%'; b.style.animationDelay = (Math.random() * 1.2) + 's';
      bubbles.appendChild(b);
    }

    function frame() {
      if (!playing || !stage.isConnected) return;
      const sec = (performance.now() - t0) / 1000;
      if (phase === 'temp' && !busy) {
        const ph = (sec / F.sweepSec) % 2;                         // 0→1 오름, 1→2 내림
        temp = F.low + (F.high - F.low) * (ph < 1 ? ph : 2 - ph);
        level.style.height = pct(temp) + '%';
        read.textContent = Math.round(temp) + '℃';
      } else if (phase === 'brown' && !busy) {
        v = Math.min(100, sec / F.secToBurn * 100);
        mark.style.left = v + '%';
        food.style.filter = cookFilter(v);
        if (v >= 100) press();
      }
      requestAnimationFrame(frame);
    }
    function press() {
      if (!playing || busy) return;
      busy = true;
      if (phase === 'temp') {
        const t = Math.round(temp);
        const [kind, word, pts] = t >= F.best[0] && t <= F.best[1] ? ['perfect', t + '℃ 딱 좋아요!', 100]
          : t >= F.ok[0] && t <= F.ok[1] ? ['good', t + '℃ 괜찮아요', 75]
          : t < F.ok[0] ? ['bad', t + '℃ 너무 차가워요!', 30] : ['bad', t + '℃ 너무 뜨거워요!', 30];
        results.push(pts);
        GGCook.ui.buzz(kind === 'bad' ? [60, 40, 60] : [20, 30, 20, 30, 20]);    // 치이익
        if (window.GGSound) GGSound.play(kind === 'bad' ? 'error' : 'pop');
        popWord(stage, word, kind);
        food.classList.add('in'); bubbles.classList.add('on');
        setTimeout(() => {
          phase = 'brown'; busy = false; t0 = performance.now();
          stage.querySelector('.fr-thermo').hidden = true; doneWrap.hidden = false;
          stage.querySelector('.heat-hud').textContent = '노릇해지면 건져요';
          btn.textContent = '건지기';
        }, 900);
      } else {
        const [kind, word, pts] = judgeDone(v, F.zone);
        results.push(pts);
        GGCook.ui.buzz(kind === 'bad' ? [60, 40, 60] : 30);
        if (window.GGSound) GGSound.play(kind === 'bad' ? 'error' : 'pop');
        popWord(stage, word, kind);
        food.classList.remove('in'); bubbles.classList.remove('on');
        setTimeout(end, 900);
      }
    }
    function end() {
      playing = false;
      const score = results.reduce((a, b) => a + b, 0) / results.length;
      GGCook.ui.feedback(stage, score, finish, '기름 온도 ' + results[0] + '점 · 튀김 색 ' + results[1] + '점');
    }
    btn.onpointerdown = (e) => { e.preventDefault(); press(); };
    btn.oncontextmenu = (e) => e.preventDefault();

    GGCook.ui.intro(stage, '튀기기', '기름 온도가 오르내려요. <b>' + F.best[0] + '~' + F.best[1] + '℃</b>(초록 칸)일 때 [넣기]!<br>그다음 튀김이 <b>노릇노릇</b>해지면 [건지기]를 눌러요.', () => {
      playing = true; t0 = performance.now(); frame();
    });
  };

  /* ================= 버무리기 ================= */
  GGCook.games.toss = function (stage, step, finish) {
    const T = GG_TOSS;
    const items = solidsOf(step);
    const grams = step.items.reduce((s, it) => s + GGCalc.grams(it.ing, it.amount), 0);
    const need = Math.max(T.minTurns, Math.min(T.maxTurns, Math.round(grams / T.gramsPerTurn)));
    const limit = Math.round(need * T.secPerTurn + T.extraSec);
    let turned = 0, playing = false, timer = null, lastA = null, buzzAt = 0;

    stage.innerHTML =
      '<div class="heat-hud">그릇 안을 동그랗게 돌려요</div>' +
      '<div class="mx-bowl"><div class="mx-food"></div><div class="mx-guide"></div></div>' +
      '<div class="heat-progress mx-prog"><div class="fill"></div><span></span></div>';
    const bowl = stage.querySelector('.mx-bowl');
    const foodBox = stage.querySelector('.mx-food');
    const prog = stage.querySelector('.mx-prog .fill');
    const label = stage.querySelector('.mx-prog span');
    const pieces = addPieces(foodBox, items, 6);
    pieces.forEach((d, i) => {
      const a = i / pieces.length * Math.PI * 2, r = 22 + (i % 2) * 12;
      d.style.left = (50 + Math.cos(a) * r) + '%'; d.style.top = (50 + Math.sin(a) * r) + '%';
    });
    function draw() {
      foodBox.style.transform = 'rotate(' + (turned * 360) + 'deg)';
      prog.style.width = Math.min(100, turned / need * 100) + '%';
      label.textContent = '섞기 ' + Math.min(need, Math.floor(turned)) + ' / ' + need + '바퀴';
    }
    function angle(e) {
      const r = bowl.getBoundingClientRect();
      return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
    }
    stage.onpointerdown = (e) => { lastA = angle(e); };
    stage.onpointermove = (e) => {
      if (lastA === null || !playing) return;
      const a = angle(e);
      let d = a - lastA;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      lastA = a;
      turned += Math.abs(d) / (Math.PI * 2);                       // 어느 방향으로 돌려도 됨
      const now = performance.now();
      if (now > buzzAt) { GGCook.ui.buzz(10); buzzAt = now + 180; }
      draw();
      if (turned >= need) end(true);
    };
    stage.onpointerup = stage.onpointercancel = () => { lastA = null; };

    function end(done) {
      if (!playing) return;
      playing = false; timer.stop();
      const score = done ? 75 + Math.min(25, timer.left() / limit * 80) : 70 * turned / need;
      GGCook.ui.feedback(stage, score, finish, done ? need + '바퀴 골고루 섞었어요!' : need + '바퀴 중 ' + Math.floor(turned) + '바퀴 섞었어요.');
    }

    draw();
    GGCook.ui.intro(stage, '버무리기', '손가락으로 그릇 안을 <b>동그랗게 빙글빙글</b> 돌려요.<br>' + need + '바퀴 돌리면 완성! 제한 시간 ' + limit + '초', () => {
      playing = true; timer = GGCook.ui.timer(stage, limit, () => end(false));
    });
  };
})();

/* 양념 넣기: 점수 없이 버튼 한 번으로 넘어가는 단계 */
(function () {
  function simple(stage, step, finish, opt) {
    stage.innerHTML = '<div class="heat-hud">' + opt.hud + '</div><div class="sp-bowl"><div class="sp-in"></div></div>' +
      '<button class="pour-hold gr-btn">' + opt.btn + '</button>';
    const box = stage.querySelector('.sp-in');
    const btn = stage.querySelector('.gr-btn');
    let done = false;
    btn.onclick = () => {
      if (done) return; done = true;
      const list = step.items.length ? step.items : [];
      list.slice(0, 8).forEach((it, i) => {
        const d = document.createElement('div'); d.className = 'mx-piece sp-drop';
        d.style.left = (25 + (i % 4) * 17) + '%'; d.style.top = (35 + Math.floor(i / 4) * 30) + '%';
        d.style.animationDelay = (i * 0.08) + 's';
        d.appendChild(window.GGApp.photo(it.ing)); box.appendChild(d);
      });
      GGCook.ui.buzz(20);
      if (window.GGSound) GGSound.play('pop');
      setTimeout(() => finish(null), 900 + list.length * 80);
    };
  }
  GGCook.games.season = (stage, step, finish) => simple(stage, step, finish, { hud: '양념을 넣어요', btn: '넣기' });
})();
