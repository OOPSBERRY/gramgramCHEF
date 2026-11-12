/* 썰기 미니게임: 도마 위 재료를 손가락으로 위아래로 쓱쓱 문질러 썬다
   - 재료 무게가 무거울수록 칼질 횟수가 늘어난다 (data/cooking.js 의 GG_CHOP)
   - 제한 시간 안에 다 썰면 높은 점수, 시간이 남을수록 더 높은 점수 */
(function () {
  const C = GG_CHOP;

  function cutsFor(it) {
    const g = GGCalc.grams(it.ing, it.amount);
    return Math.max(C.minCuts, Math.min(C.maxCuts, Math.round(g / C.gramsPerCut)));
  }

  GGCook.games.chop = function (stage, step, finish) {
    const queue = step.items.map((it) => ({ it, need: cutsFor(it), done: 0 }));
    const total = queue.reduce((s, q) => s + q.need, 0);
    const seconds = Math.round(total * C.secPerCut + C.extraSec);
    let idx = 0, doneAll = 0, playing = false, timer = null;

    stage.innerHTML =
      '<div class="chop-hud"><span class="chop-name"></span><span class="chop-left"></span></div>' +
      '<div class="chop-board"><div class="chop-food"></div></div>' +
      '<div class="chop-queue"></div>';
    const board = stage.querySelector('.chop-board');
    const food = stage.querySelector('.chop-food');

    /* 재료 사진을 칼질 횟수만큼 조각내서 보여줌 (사진을 세로로 잘라 조금씩 벌림) */
    function drawFood() {
      const q = queue[idx]; if (!q) return;
      const k = q.done + 1;
      food.innerHTML = '';
      for (let i = 0; i < k; i++) {
        const s = document.createElement('div'); s.className = 'chop-slice';
        const l = i / k * 100, r = 100 - (i + 1) / k * 100;
        s.style.clipPath = 'inset(0 ' + r + '% 0 ' + l + '%)';
        s.style.transform = 'translateX(' + ((i - (k - 1) / 2) * 10) + 'px)';
        s.appendChild(window.GGApp.photo(q.it.ing));
        food.appendChild(s);
      }
      stage.querySelector('.chop-name').textContent = q.it.ing.name + ' ' + GGCalc.amountText(q.it.amount, q.it.ing.unit);
      stage.querySelector('.chop-left').textContent = '남은 칼질 ' + (q.need - q.done) + '번';
      const qb = stage.querySelector('.chop-queue'); qb.innerHTML = '';
      queue.forEach((x, i) => {
        const d = document.createElement('div');
        d.className = 'chop-q' + (i < idx ? ' done' : i === idx ? ' on' : '');
        d.appendChild(window.GGApp.photo(x.it.ing));
        qb.appendChild(d);
      });
    }

    function slash(x) {
      const r = board.getBoundingClientRect();
      const m = document.createElement('div'); m.className = 'chop-slash';
      m.style.left = Math.max(8, Math.min(r.width - 8, x - r.left)) + 'px';
      board.appendChild(m);
      setTimeout(() => m.remove(), 400);
    }

    function cut(x) {
      const q = queue[idx]; if (!q || !playing) return;
      q.done++; doneAll++;
      if (window.GGSound) GGSound.play('chop');
      GGCook.ui.buzz(15);
      slash(x);
      if (q.done >= q.need) {
        idx++;
        GGCook.ui.buzz([30, 40, 30]);                       // 재료 하나 다 썰면 두 번 '드르륵'
        if (idx >= queue.length) { end(true); return; }
        food.classList.remove('next'); void food.offsetWidth; food.classList.add('next');
      }
      drawFood();
    }

    function end(finished) {
      if (!playing) return;
      playing = false; timer.stop();
      let score, detail;
      if (finished) {
        const ratio = timer.left() / seconds;               // 남은 시간 비율
        score = 75 + Math.min(25, ratio * 80);               // 시간 안에 다 썰면 75점부터, 빨리 썰수록 100점까지
        detail = '칼질 ' + total + '번을 ' + Math.max(1, Math.round(seconds - timer.left())) + '초 만에 끝냈어요!';
      } else {
        score = 70 * doneAll / total;
        detail = '칼질 ' + total + '번 중 ' + doneAll + '번 했어요.';
      }
      GGCook.ui.feedback(stage, score, finish, detail);
    }

    /* 손가락으로 위아래 문지르기 감지: 세로로 충분히 움직이면 칼질 1번 */
    let ax = 0, ay = 0, lastY = 0, dir = 0, down = false, armed = true;   // armed: 한 번 쓸 때 칼질은 한 번만
    stage.onpointerdown = (e) => { down = true; armed = true; ax = e.clientX; ay = lastY = e.clientY; dir = 0; };
    stage.onpointermove = (e) => {
      if (!down || !playing) return;
      const y = e.clientY, d = Math.sign(y - lastY);
      if (d && dir && d !== dir) { ax = e.clientX; ay = lastY; armed = true; }     // 방향이 바뀌면 거기서 새로 시작
      if (d) dir = d;
      lastY = y;
      const minStroke = board.clientHeight * 0.22;
      if (armed && Math.abs(y - ay) > minStroke && Math.abs(y - ay) > Math.abs(e.clientX - ax) * 1.2) {
        armed = false; cut(e.clientX);
      }
    };
    stage.onpointerup = stage.onpointercancel = () => { down = false; };

    drawFood();
    GGCook.ui.intro(stage, '썰기', '손가락으로 재료 위를 <b>위아래로 쓱쓱</b> 문질러 썰어요.<br>칼질 ' + total + '번, 제한 시간 ' + seconds + '초!', () => {
      playing = true;
      timer = GGCook.ui.timer(stage, seconds, () => end(false));
    });
  };
})();
