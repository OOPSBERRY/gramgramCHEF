/* 조리하기 화면: 담은 재료로 조리 단계를 만들고, 한 단계씩 미니게임을 진행한다
   GGCook.start(items, { typeId, name, recipe }, done)  → 끝나면 done({ steps }) 를 부름
   미니게임은 GGCook.games[게임id] = function (stage, step, finish) 로 추가한다.
     stage  : 미니게임을 그릴 칸 (div)
     step   : { game, title, items: [{ ing, amount }] }
     finish : 끝나면 finish(점수 0~100) 을 부른다 */
const GGCook = (function () {
  const $ = (id) => document.getElementById(id);
  const games = {};
  let run = 0;                       // 화면을 다시 열면 이전 진행이 멈추도록 하는 번호

  const isChop = (ing) =>
    !GG_NO_CHOP_IDS.includes(ing.id) && (GG_CHOP_CATS.includes(ing.cat) || GG_CHOP_IDS.includes(ing.id));
  const isCrack = (ing) => GG_CRACK_IDS.includes(ing.id);
  const isPour = (it) =>
    (it.ing.cat === 'liquid' || GG_POUR_IDS.includes(it.ing.id)) && it.amount >= GG_POUR_MIN;

  /* ---------- 담은 재료로 조리 단계 만들기 ---------- */
  function buildSteps(items, typeId) {
    const steps = [];
    const used = new Set();
    const take = (list) => { list.forEach((it) => used.add(it.ing.id)); return list; };

    const chop = take(items.filter((it) => isChop(it.ing)));
    if (chop.length) steps.push({ game: 'chop', items: chop });

    const crack = take(items.filter((it) => isCrack(it.ing)));
    if (crack.length) steps.push({ game: 'crack', items: crack });

    take(items.filter(isPour)).forEach((it) => steps.push({ game: 'pour', items: [it] }));   // 붓기는 재료마다 따로

    const method = GG_DEFAULT_METHOD[typeId] || 'stirfry';
    steps.push({ game: method, items: items.slice(), method: true });

    const rest = items.filter((it) => !used.has(it.ing.id));
    if (rest.length) steps.push({ game: 'season', items: rest });

    steps.push({ game: 'plate', items: [] });
    steps.forEach((s) => { s.title = GG_COOK_GAMES[s.game].name; });
    return steps;
  }

  /* ---------- 화면 그리기 ---------- */
  function renderProgress(steps, cur) {
    const box = $('cook-steps'); box.innerHTML = '';
    steps.forEach((s, i) => {
      const d = document.createElement('div');
      d.className = 'cook-chip' + (i < cur ? ' done' : i === cur ? ' on' : '');
      d.textContent = (i + 1) + '. ' + s.title;
      box.appendChild(d);
    });
    const on = box.children[cur];
    if (on) try { on.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); } catch (e) { /* 무시 */ }
  }

  function renderInfo(step, i, total) {
    const g = GG_COOK_GAMES[step.game];
    $('cook-count').textContent = (i + 1) + ' / ' + total + ' 단계';
    $('cook-name').textContent = g.name;
    $('cook-desc').textContent = g.desc;
    const box = $('cook-items'); box.innerHTML = '';
    step.items.forEach((it) => {
      const d = document.createElement('div'); d.className = 'cook-item';
      const ph = document.createElement('div'); ph.className = 'ph'; ph.appendChild(window.GGApp.photo(it.ing));
      d.appendChild(ph);
      d.insertAdjacentHTML('beforeend', '<div class="nm">' + it.ing.name + '</div><div class="am">' + GGCalc.amountText(it.amount, it.ing.unit) + '</div>');
      box.appendChild(d);
    });
  }

  /* 아직 만들지 않은 미니게임 자리: [다음] 버튼만 보여줌 */
  function placeholder(stage, step, finish) {
    const g = GG_COOK_GAMES[step.game];
    stage.innerHTML = '<div class="cook-soon"><div class="big">' + g.name + '</div><div>미니게임은 곧 만들어요</div></div>';
    const b = document.createElement('button');
    b.className = 'cook-next'; b.textContent = '다음 단계 →';
    b.onclick = () => finish(null);
    stage.querySelector('.cook-soon').appendChild(b);
  }

  /* ---------- 미니게임들이 같이 쓰는 화면 조각 ---------- */
  const ui = {
    /* 진동 (안드로이드 태블릿에서만 울림. 아이패드는 지원하지 않아서 그냥 넘어감)
       ms: 숫자 하나(예: 20) 또는 [울림, 쉼, 울림, ...] */
    buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* 무시 */ } },
    /* 시작 안내: 설명을 보여 주고 [시작!]을 누르면 onStart */
    intro(stage, title, text, onStart) {
      const d = document.createElement('div'); d.className = 'cook-overlay';
      d.innerHTML = '<div class="big">' + title + '</div><div class="txt">' + text + '</div>';
      const b = document.createElement('button'); b.className = 'cook-next'; b.textContent = '시작!';
      b.onclick = () => { d.remove(); onStart(); };
      d.appendChild(b); stage.appendChild(d);
    },
    /* 시간 막대: seconds 초가 지나면 onEnd. stop()으로 멈추고, left()로 남은 초를 알 수 있음 */
    timer(stage, seconds, onEnd) {
      const bar = document.createElement('div'); bar.className = 'cook-timer';
      bar.innerHTML = '<div class="fill"></div><span></span>';
      stage.appendChild(bar);
      const fill = bar.querySelector('.fill'), label = bar.querySelector('span');
      const t0 = performance.now(); let stopped = false, leftSec = seconds;
      (function tick(now) {
        if (stopped || !bar.isConnected) return;
        leftSec = Math.max(0, seconds - (now - t0) / 1000);
        fill.style.width = (leftSec / seconds * 100) + '%';
        bar.classList.toggle('low', leftSec < seconds * 0.25);
        label.textContent = Math.ceil(leftSec) + '초';
        if (leftSec <= 0) { stopped = true; onEnd(); return; }
        requestAnimationFrame(tick);
      })(t0);
      return { stop() { stopped = true; }, left: () => leftSec };
    },
    /* 평가 보여 주기: 점수(0~100)에 따라 완벽해요/좋아요/아쉬워요 → [다음 단계] */
    feedback(stage, score, finish, detail) {
      const s = Math.max(0, Math.min(100, Math.round(score)));
      const [word, cls, snd] = s >= 90 ? ['완벽해요!', 'great', 'good'] : s >= 70 ? ['좋아요!', 'good', 'ding'] : ['아쉬워요', 'soso', 'soft'];
      if (window.GGSound) GGSound.play(snd);
      const d = document.createElement('div'); d.className = 'cook-overlay ' + cls;
      d.innerHTML = '<div class="big">' + word + '</div><div class="score">' + s + '점</div>' + (detail ? '<div class="txt">' + detail + '</div>' : '');
      const b = document.createElement('button'); b.className = 'cook-next'; b.textContent = '다음 단계 →';
      b.onclick = () => finish(s);
      d.appendChild(b); stage.appendChild(d);
    }
  };

  /* ---------- 진행 ---------- */
  function start(items, opt, done) {
    const my = ++run;
    const steps = buildSteps(items, opt.typeId);
    $('cook-title').textContent = '조리하기: ' + (opt.name || '나의 요리');
    let cur = 0;

    function next() {
      if (my !== run) return;
      if (cur >= steps.length) { done({ steps }); return; }
      const step = steps[cur];
      renderProgress(steps, cur);
      renderInfo(step, cur, steps.length);
      const stage = $('cook-stage'); stage.innerHTML = '';
      (games[step.game] || placeholder)(stage, step, (score) => {
        if (my !== run) return;
        step.score = score;
        if (window.GGSound) GGSound.play('click');
        cur++; next();
      });
    }

    $('cook-back').onclick = () => {
      if (confirm('조리를 멈추고 재료 고르기로 돌아갈까요?')) { run++; window.GGApp.show('screen-kitchen'); }
    };
    window.GGApp.show('screen-cook');
    next();
  }

  return { start, games, buildSteps, ui };
})();
