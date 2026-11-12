/* 썰기 미니게임: 도마 위 재료를 손가락으로 위아래로 쓱쓱 문질러 썬다
   - 재료 무게가 무거울수록 칼질 횟수가 늘어난다 (data/cooking.js 의 GG_CHOP)
   - 제한 시간 안에 다 썰면 높은 점수, 시간이 남을수록 더 높은 점수 */
(function () {
  const C = GG_CHOP;
  /* 칼 그림: 위에서 내려다본 칼. 얇은 칼날이 위로 길게, 손잡이는 아래쪽 (칼날 가운데 = 썰리는 선) */
  const KNIFE =
    '<svg viewBox="0 0 40 480" aria-hidden="true">' +
    '<path class="blade" d="M15 300 L15 22 Q20 0 25 22 L25 300 Z"/>' +
    '<rect class="spine" x="12" y="296" width="16" height="16" rx="4"/>' +
    '<rect class="handle" x="8" y="308" width="24" height="170" rx="12"/>' +
    '<rect class="shine" x="13" y="320" width="4" height="140" rx="2"/>' +
    '</svg>';

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
      '<div class="chop-queue"></div>' +
      '<div class="chop-knife"><div class="in">' + KNIFE + '</div></div>';
    const board = stage.querySelector('.chop-board');
    const food = stage.querySelector('.chop-food');
    const knife = stage.querySelector('.chop-knife');
    /* 재료를 (칼질 횟수 + 1) 조각으로 나눠요. 오른쪽부터 한 조각씩 썰어 나가요 */
    const cutAt = (q, j) => 1 - j / (q.need + 1);      // j번째 칼질 자리 (재료 왼쪽 0 ~ 오른쪽 1)

    /* 칼을 다음에 썰 자리로 옮겨요 */
    function placeTools() {
      const q = queue[idx]; if (!q) return;
      const sr = stage.getBoundingClientRect(), fr = food.getBoundingClientRect(), br = board.getBoundingClientRect();
      const f = cutAt(q, q.done + 1);
      const x = fr.left + fr.width * f - sr.left;
      knife.style.transform = 'translate(' + (x - knife.offsetWidth / 2) + 'px, ' + (br.top - sr.top - knife.offsetHeight * 0.12) + 'px)';
    }

    /* 재료 사진을 조각내서 보여줌: 남은 덩어리 + 썰린 조각들(오른쪽으로 조금씩 밀려남) */
    function drawFood() {
      const q = queue[idx]; if (!q) return;
      food.innerHTML = '';
      const pieces = [[0, cutAt(q, q.done), 0]];
      for (let j = 1; j <= q.done; j++) pieces.push([cutAt(q, j), cutAt(q, j - 1), (q.done - j + 1) * 7]);
      pieces.forEach(([l, r, dx]) => {
        const s = document.createElement('div'); s.className = 'chop-slice';
        s.style.clipPath = 'inset(0 ' + (100 - r * 100) + '% 0 ' + (l * 100) + '%)';
        s.style.transform = 'translateX(' + dx + 'px)';
        s.appendChild(window.GGApp.photo(q.it.ing));
        food.appendChild(s);
      });
      stage.querySelector('.chop-name').textContent = q.it.ing.name + ' ' + GGCalc.amountText(q.it.amount, q.it.ing.unit);
      stage.querySelector('.chop-left').textContent = '남은 칼질 ' + (q.need - q.done) + '번';
      const qb = stage.querySelector('.chop-queue'); qb.innerHTML = '';
      queue.forEach((x, i) => {
        const d = document.createElement('div');
        d.className = 'chop-q' + (i < idx ? ' done' : i === idx ? ' on' : '');
        d.appendChild(window.GGApp.photo(x.it.ing));
        qb.appendChild(d);
      });
      requestAnimationFrame(placeTools);
    }

    function chopAnim() {
      knife.classList.remove('chop'); void knife.offsetWidth; knife.classList.add('chop');
    }

    function cut() {
      const q = queue[idx]; if (!q || !playing) return;
      q.done++; doneAll++;
      if (window.GGSound) GGSound.play('chop');
      GGCook.ui.buzz(15);
      chopAnim();
      if (q.done >= q.need) {
        idx++;
        GGCook.ui.buzz([30, 40, 30]);                       // 재료 하나 다 썰면 두 번 '드르륵'
        if (idx >= queue.length) { drawFoodDone(q); end(true); return; }
        setTimeout(() => { food.classList.remove('next'); void food.offsetWidth; food.classList.add('next'); drawFood(); }, 250);
        drawFoodDone(q);
        return;
      }
      drawFood();
    }
    /* 마지막 칼질 직후 잠깐 다 썰린 모습 보여주기 */
    function drawFoodDone(q) {
      const keep = idx; idx = queue.indexOf(q); drawFood(); idx = keep;
    }

    function end(finished) {
      if (!playing) return;
      playing = false; timer.stop();
      let score, detail;
      if (finished) {
        const ratio = timer.left() / seconds;               // 남은 시간 비율
        score = 75 + Math.min(25, ratio * 80);               // 시간 안에 다 썰면 75점부터, 빨리 썰수록 100점까지
        detail = '칼질 ' + total + '번을 ' + Math.max(1, Math.round(seconds - timer.left())) + '초 만에 끝냈어요.';
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
        armed = false; cut();
      }
    };
    stage.onpointerup = stage.onpointercancel = () => { down = false; };
    window.addEventListener('resize', placeTools);

    drawFood();
    GGCook.ui.intro(stage, '썰기', '칼이 썰 자리에 서 있어요. 손가락으로 화면을 <b>위아래로 쓱쓱</b> 문지르면<br>칼이 한 번씩 내려가며 썰어요.<br>칼질 ' + total + '번, 제한 시간 ' + seconds + '초', () => {
      playing = true;
      timer = GGCook.ui.timer(stage, seconds, () => end(false));
    });
  };
})();
