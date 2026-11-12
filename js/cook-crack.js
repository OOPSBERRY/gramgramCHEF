/* 달걀 깨기 미니게임: 힘 표시가 좌우로 움직일 때, 가운데 초록 칸에서 [톡!]을 누른다
   - 달걀 개수는 양에 따라 (data/cooking.js 의 GG_CRACK)
   - 초록 칸 100점 / 노란 칸 75점 / 바깥은 껍데기가 들어가서 30점 */
(function () {
  const K = GG_CRACK;

  GGCook.games.crack = function (stage, step, finish) {
    /* 깰 달걀 목록 (달걀 2개 + 노른자 1개처럼 섞일 수 있음) */
    const eggs = [];
    step.items.forEach((it) => {
      const each = K.gramsEach[it.ing.id] || 50;
      const n = Math.max(1, Math.min(K.maxCount, Math.round(GGCalc.grams(it.ing, it.amount) / each)));
      for (let i = 0; i < n; i++) eggs.push(it.ing);
    });
    let idx = 0, playing = false, t0 = 0, busy = false;
    const results = [];

    stage.innerHTML =
      '<div class="crack-hud"></div>' +
      '<div class="crack-scene">' +
      '  <div class="crack-egg"><div class="half top"></div><div class="half bottom"></div></div>' +
      '  <div class="crack-bowl"><div class="crack-in"></div></div>' +
      '</div>' +
      '<div class="crack-meter"><div class="zone good"></div><div class="zone perfect"></div><div class="mark"></div></div>' +
      '<button class="pour-hold crack-btn">톡!</button>';
    const egg = stage.querySelector('.crack-egg');
    const inBowl = stage.querySelector('.crack-in');
    const mark = stage.querySelector('.mark');
    stage.querySelector('.zone.perfect').style.cssText = 'left:' + (50 - K.perfect / 2) + '%;width:' + K.perfect + '%';
    stage.querySelector('.zone.good').style.cssText = 'left:' + (50 - K.good / 2) + '%;width:' + K.good + '%';

    function hud() {
      const ing = eggs[idx];
      stage.querySelector('.crack-hud').textContent = (ing ? ing.name : '') + ' ' + Math.min(idx + 1, eggs.length) + ' / ' + eggs.length + '개';
    }
    /* 표시 위치 0~100 (왕복) */
    function pos() {
      const period = Math.max(0.6, K.period - K.speedUp * idx) * 1000;
      const ph = ((performance.now() - t0) % period) / period;
      return (ph < 0.5 ? ph * 2 : 2 - ph * 2) * 100;
    }
    function loop() {
      if (!playing || !stage.isConnected) return;
      if (!busy) mark.style.left = pos() + '%';
      requestAnimationFrame(loop);
    }

    function tap() {
      if (!playing || busy || idx >= eggs.length) return;
      busy = true;
      const p = pos(), off = Math.abs(p - 50);
      const kind = off <= K.perfect / 2 ? 'perfect' : off <= K.good / 2 ? 'good' : 'bad';
      results.push(kind);
      const isYolk = eggs[idx].id === 'yolk';
      egg.classList.add('cracked');
      GGCook.ui.buzz(kind === 'bad' ? [60, 40, 60] : 40);
      if (window.GGSound) GGSound.play(kind === 'bad' ? 'error' : 'pop');
      /* 그릇에 노른자(와 실패하면 껍데기 조각) 떨어뜨리기 */
      const y = document.createElement('div'); y.className = 'crack-yolk' + (isYolk ? ' only' : '');
      y.style.left = (30 + Math.random() * 40) + '%';
      inBowl.appendChild(y);
      if (kind === 'bad') for (let i = 0; i < 3; i++) {
        const b = document.createElement('div'); b.className = 'crack-bit';
        b.style.left = (20 + Math.random() * 60) + '%'; b.style.top = (20 + Math.random() * 50) + '%';
        inBowl.appendChild(b);
      }
      const word = document.createElement('div'); word.className = 'crack-word ' + kind;
      word.textContent = kind === 'perfect' ? '깔끔해요!' : kind === 'good' ? '좋아요!' : (p < 50 ? '너무 약해요!' : '너무 세요!');
      stage.appendChild(word);
      setTimeout(() => {
        word.remove(); egg.classList.remove('cracked');
        idx++; busy = false; t0 = performance.now();
        if (idx >= eggs.length) end(); else hud();
      }, 900);
    }

    function end() {
      playing = false;
      const pts = { perfect: 100, good: 75, bad: 30 };
      const score = results.reduce((s, k) => s + pts[k], 0) / results.length;
      const nP = results.filter((k) => k === 'perfect').length, nB = results.filter((k) => k === 'bad').length;
      const detail = eggs.length + '개 중 깔끔하게 ' + nP + '개' + (nB ? ', 껍데기가 들어간 것 ' + nB + '개' : '');
      GGCook.ui.feedback(stage, score, finish, detail);
    }

    const btn = stage.querySelector('.crack-btn');
    btn.onpointerdown = (e) => { e.preventDefault(); tap(); };
    btn.oncontextmenu = (e) => e.preventDefault();

    hud();
    GGCook.ui.intro(stage, '달걀 깨기', '움직이는 표시가 가운데 <b>초록 칸</b>에 왔을 때 <b>[톡!]</b>을 눌러요.<br>너무 약하거나 세면 껍데기가 들어가요.<br>깰 개수: ' + eggs.length + '개', () => {
      playing = true; t0 = performance.now(); loop();
    });
  };
})();
