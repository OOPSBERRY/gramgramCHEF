/* 불을 쓰는 미니게임: 끓이기, 볶기
   끓이기 : 버튼을 눌러 불 세기를 초록 칸 안에 유지하면 끓임 막대가 찬다 (물이 많을수록 오래)
   볶기   : 팬을 손가락으로 좌우로 흔들어 타지 않게 하면서 익힘 막대를 채운다 (재료가 많을수록 많이) */
(function () {
  const isSolid = (ing) => !['liquid', 'season', 'spice', 'oil', 'sauce'].includes(ing.cat);

  /* ================= 끓이기 ================= */
  GGCook.games.boil = function (stage, step, finish) {
    const B = GG_BOIL;
    const liquids = step.items.filter((it) => it.ing.cat === 'liquid' || GG_POUR_IDS.includes(it.ing.id));
    const liters = liquids.reduce((s, it) => s + it.amount, 0) / 1000;
    const need = Math.min(B.maxSec, B.baseSec + liters * B.perLiter);       // 초록 칸에 있어야 하는 시간(초)
    const limit = Math.round(need * 2 + 6);                                   // 제한 시간
    const color = liquids.some((it) => it.ing.id === 'broth') ? 'broth'
      : liquids.some((it) => GG_POUR_COLOR[it.ing.id] === 'milk') ? 'milk' : 'water';
    let heat = 20, inZone = 0, overSec = 0, holding = false, playing = false, last = 0, timer = null, buzzAt = 0;

    stage.innerHTML =
      '<div class="heat-hud">보글보글 유지하기</div>' +
      '<div class="boil-wrap">' +
      '  <div class="boil-pot"><div class="boil-soup ' + color + '"></div><div class="boil-bubbles"></div><div class="boil-word"></div></div>' +
      '  <div class="boil-fire"><i></i><i></i><i></i></div>' +
      '</div>' +
      '<div class="heat-meter"><div class="zone"></div><div class="over"></div><div class="mark"></div><span>불</span></div>' +
      '<div class="heat-progress"><div class="fill"></div><span>끓임</span></div>' +
      '<button class="pour-hold heat-btn">꾹 눌러서<br>불 세게</button>';
    const mark = stage.querySelector('.heat-meter .mark');
    const fire = stage.querySelector('.boil-fire');
    const bubbles = stage.querySelector('.boil-bubbles');
    const word = stage.querySelector('.boil-word');
    const prog = stage.querySelector('.heat-progress .fill');
    stage.querySelector('.heat-meter .zone').style.cssText = 'bottom:' + B.zone[0] + '%;height:' + (B.zone[1] - B.zone[0]) + '%';
    stage.querySelector('.heat-meter .over').style.cssText = 'bottom:' + B.over + '%;height:' + (100 - B.over) + '%';
    for (let i = 0; i < 10; i++) {
      const b = document.createElement('i');
      b.style.left = (8 + Math.random() * 84) + '%'; b.style.animationDelay = (Math.random() * 1.2) + 's';
      bubbles.appendChild(b);
    }

    function frame() {
      if (!playing || !stage.isConnected) return;
      const now = performance.now(), dt = Math.max(0, Math.min(0.1, (now - last) / 1000)); last = now;
      const wobble = 1 + 0.5 * Math.sin(now / 700);                          // 불이 조금씩 일렁여서 계속 신경 써야 함
      heat = Math.max(0, Math.min(100, heat + (holding ? B.rise : -B.fall * wobble) * dt));
      const zoneOn = heat >= B.zone[0] && heat <= B.zone[1];
      const over = heat > B.over;
      if (zoneOn) inZone += dt;
      if (over) {
        overSec += dt;
        if (now > buzzAt) { GGCook.ui.buzz([50, 30, 50]); buzzAt = now + 500; }
      }
      mark.style.bottom = heat + '%';
      fire.style.transform = 'scaleY(' + (0.3 + heat / 100) + ')';
      bubbles.style.opacity = heat < B.zone[0] ? heat / B.zone[0] * 0.4 : 1;
      bubbles.style.animationDuration = '';
      stage.querySelector('.boil-pot').classList.toggle('over', over);
      word.textContent = over ? '넘쳐요!' : zoneOn ? '보글보글' : heat < B.zone[0] ? '불이 약해요' : '';
      word.className = 'boil-word' + (over ? ' bad' : zoneOn ? ' good' : '');
      prog.style.width = Math.min(100, inZone / need * 100) + '%';
      if (inZone >= need) { end(true); return; }
      requestAnimationFrame(frame);
    }

    function end(done) {
      if (!playing) return;
      playing = false; holding = false; timer.stop();
      let score, detail;
      if (done) {
        score = 100 - Math.min(45, overSec * 12);
        detail = overSec > 0.3 ? '다 끓였지만 ' + Math.round(overSec) + '초 동안 넘쳤어요.' : '넘치지 않고 알맞게 끓였어요.';
      } else {
        score = 70 * inZone / need - Math.min(30, overSec * 8);
        detail = '시간 안에 다 끓이지 못했어요.';
      }
      GGCook.ui.feedback(stage, score, finish, detail);
    }

    const btn = stage.querySelector('.heat-btn');
    btn.onpointerdown = (e) => { e.preventDefault(); holding = true; btn.classList.add('on'); };
    btn.onpointerup = btn.onpointerleave = btn.onpointercancel = () => { holding = false; btn.classList.remove('on'); };
    btn.oncontextmenu = (e) => e.preventDefault();

    GGCook.ui.intro(stage, '끓이기', '[꾹 눌러서 불 세게]를 눌렀다 뗐다 하면서<br>불 세기를 <b>초록 칸</b> 안에 맞춰요. 너무 세면 넘쳐요.<br>' +
      (liters > 0 ? '물·육수가 ' + GGCalc.amountText(liters * 1000, 'mL') + '라서 ' : '') + Math.round(need) + '초 동안 끓여야 해요.', () => {
      playing = true; last = performance.now();
      timer = GGCook.ui.timer(stage, limit, () => end(false));
      frame();
    });
  };

  /* ================= 볶기 ================= */
  GGCook.games.stirfry = function (stage, step, finish) {
    const S = GG_STIRFRY;
    const solids = step.items.filter((it) => isSolid(it.ing));
    const grams = solids.reduce((s, it) => s + GGCalc.grams(it.ing, it.amount), 0);
    const need = Math.max(S.minToss, Math.min(S.maxToss, Math.round(grams / S.gramsPerToss)));
    const limit = Math.round(need * 1.1 + 8);
    let tosses = 0, burn = 0, burnt = 0, playing = false, last = 0, timer = null;

    stage.innerHTML =
      '<div class="heat-hud">팬을 좌우로 흔들어요</div>' +
      '<div class="fry-pan"><img class="fry-panimg" src="assets/ui/pan.png" alt=""><div class="fry-food"></div><div class="fry-smoke"><i></i><i></i><i></i></div></div>' +
      '<div class="heat-meter burn"><div class="over"></div><div class="mark"></div><span>탐</span></div>' +
      '<div class="heat-progress"><div class="fill"></div><span>익힘</span></div>' +
      '<div class="fry-word"></div>';
    const pan = stage.querySelector('.fry-pan');
    const food = stage.querySelector('.fry-food');
    const mark = stage.querySelector('.heat-meter .mark');
    const prog = stage.querySelector('.heat-progress .fill');
    const smoke = stage.querySelector('.fry-smoke');
    const wordEl = stage.querySelector('.fry-word');
    stage.querySelector('.heat-meter .over').style.cssText = 'bottom:70%;height:30%';
    stage.querySelector('.fry-panimg').onerror = function () { this.remove(); pan.classList.add('nopan'); };

    /* 팬 위 재료 (최대 6가지) */
    const pieces = [];
    (solids.length ? solids : step.items).slice(0, 6).forEach((it) => {
      for (let k = 0; k < 2; k++) {
        const d = document.createElement('div'); d.className = 'fry-piece';
        d.appendChild(window.GGApp.photo(it.ing));
        food.appendChild(d); pieces.push(d);
      }
    });
    function scatter() {
      pieces.forEach((d) => {
        const a = Math.random() * Math.PI * 2, r = Math.random() * 30;
        d.style.left = (50 + Math.cos(a) * r) + '%'; d.style.top = (50 + Math.sin(a) * r * 0.8) + '%';
        d.style.transform = 'translate(-50%, -50%) rotate(' + (Math.random() * 360) + 'deg)';
      });
    }

    function say(t, cls) {
      wordEl.textContent = t; wordEl.className = 'fry-word ' + cls;
      wordEl.style.animation = 'none'; void wordEl.offsetWidth; wordEl.style.animation = '';
    }

    function toss(dir) {
      if (!playing) return;
      tosses++; burn = Math.max(0, burn - S.coolPerToss);
      pan.style.transform = 'translateX(' + (dir * 24) + 'px) rotate(' + (dir * 4) + 'deg)';
      setTimeout(() => { pan.style.transform = ''; }, 120);
      scatter();
      GGCook.ui.buzz(12);
      if (window.GGSound) GGSound.play('chop');
      prog.style.width = Math.min(100, tosses / need * 100) + '%';
      if (tosses >= need) end(true);
    }

    function frame() {
      if (!playing || !stage.isConnected) return;
      const now = performance.now(), dt = Math.max(0, Math.min(0.1, (now - last) / 1000)); last = now;
      burn = Math.min(100, burn + S.burnPerSec * dt);
      if (burn >= 100) {
        burnt++; burn = 45;
        GGCook.ui.buzz([80, 40, 80]);
        if (window.GGSound) GGSound.play('error');
        say('앗, 탔어요!', 'bad');
      }
      mark.style.bottom = burn + '%';
      const dark = Math.min(0.55, burnt * 0.15 + (burn > 70 ? (burn - 70) / 100 : 0));
      food.style.filter = 'brightness(' + (1 - dark) + ') sepia(' + dark + ')';
      smoke.style.opacity = burn > 60 ? (burn - 60) / 40 : 0;
      requestAnimationFrame(frame);
    }

    function end(done) {
      if (!playing) return;
      playing = false; timer.stop();
      let score, detail;
      if (done) {
        score = 100 - burnt * 25;
        detail = burnt ? '다 볶았지만 ' + burnt + '번 탔어요.' : '하나도 안 태우고 잘 볶았어요.';
      } else {
        score = 70 * tosses / need - burnt * 15;
        detail = '시간 안에 다 볶지 못했어요.';
      }
      GGCook.ui.feedback(stage, score, finish, detail);
    }

    /* 좌우로 흔들기 감지: 가로로 충분히 움직이면 1번 (방향이 바뀌어야 다음 1번) */
    let ax = 0, lastX = 0, dir = 0, down = false, armed = true;
    stage.onpointerdown = (e) => { down = true; armed = true; ax = lastX = e.clientX; dir = 0; };
    stage.onpointermove = (e) => {
      if (!down || !playing) return;
      const x = e.clientX, d = Math.sign(x - lastX);
      if (d && dir && d !== dir) { ax = lastX; armed = true; }          // 방향이 바뀌면 거기서 새로 시작
      if (d) dir = d;
      lastX = x;
      if (armed && Math.abs(x - ax) > stage.clientWidth * 0.12) { armed = false; toss(Math.sign(x - ax)); }
    };
    stage.onpointerup = stage.onpointercancel = () => { down = false; };

    scatter();
    GGCook.ui.intro(stage, '볶기', '손가락으로 팬을 <b>좌우로 쓱쓱</b> 흔들어요.<br>가만히 두면 재료가 타요. 탐 막대가 빨간 칸에 가기 전에 흔들어요.<br>' +
      need + '번 흔들면 완성이에요.', () => {
      playing = true; last = performance.now();
      timer = GGCook.ui.timer(stage, limit, () => end(false));
      frame();
    });
  };
})();
