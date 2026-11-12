/* 붓기 미니게임: 버튼을 꾹 누르는 동안 계량컵에 액체가 차오른다. 눈금을 읽고 목표량에서 손을 뗀다
   - 지금 몇 mL인지는 숫자로 보여 주지 않음 (눈금 읽기 연습)
   - 여러 번 나눠 부어도 되고, [다 부었어요]를 누르면 끝 */
(function () {
  const P = GG_POUR;

  /* 눈금 간격: 컵 전체가 5~10칸 정도 되게 고름 */
  function tickStep(max) {
    const steps = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
    return steps.find((s) => max / s <= 10) || 1000;
  }

  GGCook.games.pour = function (stage, step, finish) {
    const it = step.items[0];
    const target = it.amount;                                   // mL
    const st = tickStep(target * 1.5);
    const max = Math.ceil(target * 1.5 / st) * st;              // 컵 눈금 끝 (목표의 1.5배쯤)
    const speed = target / P.seconds;                           // 1초에 붓는 양
    const color = GG_POUR_COLOR[it.ing.id] || 'water';
    let poured = 0, pouring = false, last = 0, playing = false, buzzTimer = null;

    let ticks = '';
    for (let v = st; v <= max; v += st) {
      ticks += '<div class="pour-tick" style="bottom:' + (v / max * 100) + '%"><span>' + v + '</span></div>';
    }
    stage.innerHTML =
      '<div class="pour-hud">' + it.ing.name + ' <b>' + target + 'mL</b>를 부어요</div>' +
      '<div class="pour-wrap">' +
      '  <div class="pour-cup"><div class="pour-stream ' + color + '"></div><div class="pour-liquid ' + color + '"></div>' + ticks + '<div class="pour-unit">mL</div></div>' +
      '  <div class="pour-btns"><button class="pour-hold">꾹 눌러서<br>붓기</button><button class="cook-next pour-done" disabled>다 부었어요</button></div>' +
      '</div>';
    const liquid = stage.querySelector('.pour-liquid');
    const stream = stage.querySelector('.pour-stream');
    const hold = stage.querySelector('.pour-hold');
    const doneBtn = stage.querySelector('.pour-done');

    function draw() { liquid.style.height = (poured / max * 100) + '%'; }

    function tick() {
      if (!pouring || !stage.isConnected) return;
      const now = performance.now();
      poured = Math.min(max, poured + speed * Math.max(0, now - last) / 1000);
      last = now; draw();
      if (poured >= max) { stop(); return; }                    // 컵이 가득 참
      requestAnimationFrame(tick);
    }
    function startPour(e) {
      if (!playing || poured >= max) return;
      e.preventDefault();
      pouring = true; last = performance.now();
      stream.classList.add('on'); hold.classList.add('on');
      buzzTimer = setInterval(() => GGCook.ui.buzz(8), 140);    // 졸졸 진동
      requestAnimationFrame(tick);
    }
    function stop() {
      if (!pouring) return;
      pouring = false;
      stream.classList.remove('on'); hold.classList.remove('on');
      clearInterval(buzzTimer);
      doneBtn.disabled = poured <= 0;
    }
    hold.onpointerdown = startPour;
    hold.onpointerup = hold.onpointerleave = hold.onpointercancel = stop;
    hold.oncontextmenu = (e) => e.preventDefault();             // 길게 눌러도 메뉴가 안 뜨게

    doneBtn.onclick = () => {
      stop(); playing = false;
      const p = Math.round(poured), diff = Math.abs(p - target);
      const errPct = diff / target * 100;
      const score = errPct <= P.perfect ? 100 : Math.max(0, 100 * (P.zero - errPct) / (P.zero - P.perfect));
      const detail = '목표 ' + target + 'mL, 부은 양 ' + p + 'mL' + (diff ? ' (' + diff + 'mL ' + (p > target ? '많아요' : '적어요') + ')' : ' (딱 맞아요!)');
      GGCook.ui.feedback(stage, score, finish, detail);
    };

    draw();
    GGCook.ui.intro(stage, '붓기', '<b>' + it.ing.name + ' ' + target + 'mL</b>를 계량컵에 부어요.<br>[꾹 눌러서 붓기]를 누르고 있다가 <b>눈금을 보고</b> 손을 떼요.<br>여러 번 나눠 부어도 돼요!', () => { playing = true; });
  };
})();
