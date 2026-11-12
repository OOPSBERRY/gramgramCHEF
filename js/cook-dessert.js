/* 디저트 미니게임: 거품 내기, 반죽하기, 굳히기
   거품 내기 : 그릇 안을 빙글빙글 돌리면 거품이 부풀어요. 뿔이 섰을 때 [다 됐어요]. 너무 오래 하면 버터가 돼요
   반죽하기  : 반죽을 손가락으로 아래로 꾹꾹 밀어 매끈하게
   굳히기    : 냉장고 시계가 목표 시간이 됐을 때 [꺼내기] */
(function () {
  const photoBox = (ing, cls) => { const d = document.createElement('div'); d.className = cls; d.appendChild(window.GGApp.photo(ing)); return d; };

  /* ================= 거품 내기 ================= */
  GGCook.games.whip = function (stage, step, finish) {
    const W = GG_WHIP;
    let turns = 0, playing = false, timer = null, lastA = null, buzzAt = 0;
    stage.innerHTML =
      '<div class="heat-hud">빙글빙글 저어요</div>' +
      '<div class="mx-bowl wh-bowl"><div class="wh-cream"></div><div class="mx-guide"></div><div class="wh-whisk"></div></div>' +
      '<div class="wh-state"></div>' +
      '<button class="cook-next wh-done">다 됐어요</button>';
    const bowl = stage.querySelector('.wh-bowl');
    const cream = stage.querySelector('.wh-cream');
    const whisk = stage.querySelector('.wh-whisk');
    const state = stage.querySelector('.wh-state');

    function stateOf(t) {
      if (t >= W.butter) return ['bad', '버터가 됐어요!'];
      if (t > W.peak[1]) return ['good', '조금 단단해요'];
      if (t >= W.peak[0]) return ['perfect', '뿔이 섰어요!'];
      if (t >= W.peak[0] * 0.5) return ['good', '부드러운 거품'];
      return ['', '아직 묽어요'];
    }
    function draw() {
      const k = Math.min(1, turns / W.peak[0]);
      cream.style.transform = 'scale(' + (0.55 + k * 0.4) + ')';
      cream.className = 'wh-cream' + (turns >= W.butter ? ' butter' : turns >= W.peak[0] ? ' peak' : '');
      const [cls, word] = stateOf(turns);
      state.textContent = word; state.className = 'wh-state ' + cls;
    }
    function angle(e) {
      const r = bowl.getBoundingClientRect();
      return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
    }
    stage.onpointerdown = (e) => { if (e.target.closest('button')) return; lastA = angle(e); };
    stage.onpointermove = (e) => {
      if (lastA === null || !playing) return;
      const a = angle(e);
      let d = a - lastA;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      lastA = a; turns += Math.abs(d) / (Math.PI * 2);
      const r = bowl.getBoundingClientRect();
      whisk.style.left = (e.clientX - r.left) + 'px'; whisk.style.top = (e.clientY - r.top) + 'px';
      const now = performance.now();
      if (now > buzzAt) { GGCook.ui.buzz(8); buzzAt = now + 150; }
      draw();
    };
    stage.onpointerup = stage.onpointercancel = () => { lastA = null; };

    function end(byTimer) {
      if (!playing) return;
      playing = false; timer.stop();
      const [cls, word] = stateOf(turns);
      const score = cls === 'perfect' ? 100 : cls === 'bad' ? 20 : turns > W.peak[1] ? 70 : turns >= W.peak[0] * 0.5 ? 55 : 25;
      GGCook.ui.feedback(stage, score, finish, (byTimer ? '시간이 다 됐어요. ' : '') + '거품 상태: ' + word);
    }
    stage.querySelector('.wh-done').onclick = () => end(false);

    draw();
    GGCook.ui.intro(stage, '거품 내기', '손가락으로 그릇 안을 <b>빙글빙글</b> 돌려 거품을 내요.<br><b>"뿔이 섰어요!"</b>가 보이면 [다 됐어요]를 눌러요.<br>너무 오래 저으면 버터가 돼 버려요!', () => {
      playing = true; timer = GGCook.ui.timer(stage, W.limitSec, () => end(true));
    });
  };

  /* ================= 반죽하기 ================= */
  GGCook.games.knead = function (stage, step, finish) {
    const K = GG_KNEAD;
    const grams = step.items.reduce((s, it) => s + GGCalc.grams(it.ing, it.amount), 0);
    const need = Math.max(K.minPush, Math.min(K.maxPush, Math.round(grams / K.gramsPerPush)));
    const limit = Math.round(need * K.secPerPush + K.extraSec);
    let pushes = 0, playing = false, timer = null;

    stage.innerHTML =
      '<div class="heat-hud">반죽을 아래로 꾹꾹 밀어요</div>' +
      '<div class="chop-board kn-board"><div class="kn-dough"></div></div>' +
      '<div class="heat-progress mx-prog"><div class="fill"></div><span></span></div>';
    const board = stage.querySelector('.kn-board');
    const dough = stage.querySelector('.kn-dough');
    const prog = stage.querySelector('.mx-prog .fill');
    const label = stage.querySelector('.mx-prog span');
    for (let i = 0; i < 9; i++) {                                    // 울퉁불퉁 덩어리 (반죽할수록 사라짐)
      const b = document.createElement('i');
      b.style.left = (15 + Math.random() * 70) + '%'; b.style.top = (15 + Math.random() * 70) + '%';
      b.style.width = b.style.height = (14 + Math.random() * 16) + '%';
      dough.appendChild(b);
    }
    const lumps = Array.from(dough.querySelectorAll('i'));
    function draw() {
      const k = Math.min(1, pushes / need);
      lumps.forEach((b, i) => { b.style.opacity = i / lumps.length < 1 - k ? 1 : 0; });
      prog.style.width = k * 100 + '%';
      label.textContent = '반죽 ' + Math.min(pushes, need) + ' / ' + need + '번';
    }
    function push() {
      pushes++;
      dough.classList.remove('squash'); void dough.offsetWidth; dough.classList.add('squash');
      GGCook.ui.buzz(25);
      if (window.GGSound) GGSound.play('pop');
      draw();
      if (pushes >= need) end(true);
    }
    let ay = 0, down = false, armed = true;
    stage.onpointerdown = (e) => { down = true; armed = true; ay = e.clientY; };
    stage.onpointermove = (e) => {
      if (!down || !playing) return;
      if (e.clientY < ay) { ay = e.clientY; armed = true; }          // 위로 올라가면 다시 준비
      if (armed && e.clientY - ay > board.clientHeight * 0.2) { armed = false; push(); }
    };
    stage.onpointerup = stage.onpointercancel = () => { down = false; };

    function end(done) {
      if (!playing) return;
      playing = false; timer.stop();
      const score = done ? 75 + Math.min(25, timer.left() / limit * 80) : 70 * pushes / need;
      GGCook.ui.feedback(stage, score, finish, done ? '반죽이 매끈해졌어요!' : need + '번 중 ' + pushes + '번 반죽했어요.');
    }

    draw();
    GGCook.ui.intro(stage, '반죽하기', '손가락으로 반죽을 <b>위에서 아래로 꾹</b> 밀어요.<br>' + need + '번 밀면 매끈한 반죽이 돼요! 제한 시간 ' + limit + '초', () => {
      playing = true; timer = GGCook.ui.timer(stage, limit, () => end(false));
    });
  };

  /* ================= 굳히기 ================= */
  GGCook.games.chill = function (stage, step, finish) {
    const C = GG_CHILL;
    const target = step.chillMin || C.defaultMin;
    const freeze = !!step.freeze;
    let t0 = 0, mins = 0, playing = false;
    const fmt = (m) => { m = Math.round(m); const h = Math.floor(m / 60), r = m % 60; return ((h ? h + '시간 ' : '') + (r || !h ? r + '분' : '')).trim(); };

    stage.innerHTML =
      '<div class="heat-hud">' + (freeze ? '냉동실' : '냉장고') + '에서 <b>' + fmt(target) + '</b> 굳혀요</div>' +
      '<div class="ch-wrap">' +
      '  <div class="ch-fridge' + (freeze ? ' freeze' : '') + '"><div class="ch-food"></div></div>' +
      '  <div class="ch-clock"><div class="ch-face"><b style="top:6%;left:50%">12</b><b style="top:50%;left:92%">3</b><b style="top:92%;left:50%">6</b><b style="top:50%;left:8%">9</b><i class="h"></i><i class="m"></i></div><div class="ch-read">시작: 12시</div></div>' +
      '</div>' +
      '<button class="pour-hold gr-btn">꺼내기</button>';
    const food = stage.querySelector('.ch-food');
    const hand = stage.querySelector('.ch-face .m');
    const hourHand = stage.querySelector('.ch-face .h');
    const read = stage.querySelector('.ch-read');
    const main = step.items.filter((it) => it.ing.cat !== 'liquid').sort((a, b) => GGCalc.grams(b.ing, b.amount) - GGCalc.grams(a.ing, a.amount))[0] || step.items[0];   // 가장 많은 재료를 보여줌
    if (main) food.appendChild(photoBox(main.ing, 'mx-piece ch-piece'));

    function frame() {
      if (!playing || !stage.isConnected) return;
      mins = (performance.now() - t0) / 1000 * C.minPerSec;
      hand.style.transform = 'rotate(' + (mins / 60 * 360) + 'deg)';
      hourHand.style.transform = 'rotate(' + (mins / 720 * 360) + 'deg)';
      const k = Math.min(1, mins / target);
      food.style.filter = 'saturate(' + (1 - k * 0.3) + ') brightness(' + (1 + k * 0.1) + ')';
      food.classList.toggle('set', mins >= target * 0.9);
      if (mins > target * 2.5) { take(); return; }                    // 너무 오래 두면 저절로 끝
      requestAnimationFrame(frame);
    }
    function take() {
      if (!playing) return;
      playing = false;
      const diff = Math.abs(mins - target), err = diff / target * 100;
      const score = err <= C.perfect ? 100 : Math.max(0, 100 * (C.zero - err) / (C.zero - C.perfect));
      GGCook.ui.buzz(30);
      const detail = '목표 ' + fmt(target) + ', 굳힌 시간 ' + fmt(mins) +
        (err <= C.perfect ? ' (딱 맞아요!)' : mins < target ? ' (덜 굳었어요)' : ' (너무 오래 뒀어요)');
      GGCook.ui.feedback(stage, score, finish, detail);
    }
    const btn = stage.querySelector('.gr-btn');
    btn.onpointerdown = (e) => { e.preventDefault(); take(); };
    btn.oncontextmenu = (e) => e.preventDefault();

    GGCook.ui.intro(stage, '굳히기', (freeze ? '냉동실' : '냉장고') + ' 안에서는 시간이 아주 빨리 흘러요!<br>시계가 <b>' + fmt(target) + '</b>이 됐을 때 [꺼내기]를 눌러요.<br>시계 바늘을 잘 읽어 봐요.', () => {
      playing = true; t0 = performance.now(); frame();
    });
  };
})();
