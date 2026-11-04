/* 오프닝 화면: 프라이팬에서 재료가 튀어 올라 떠 있는 연출 (CSS 애니메이션 + 데이터 파일) */
(function () {
  const cfg = (typeof GG_OPENING !== 'undefined') ? GG_OPENING : null;
  const screen = document.getElementById('screen-opening');
  if (!cfg || !screen) return;
  const stage = screen.querySelector('.op-stage');

  /* 같은 입력이면 항상 같은 값이 나오는 간단한 난수 (0~1) */
  function rnd(i, k) { const s = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }

  /** 사진을 보여주고, 파일이 없으면 이모지로 대신 보이게 */
  function makeMedia(src, emoji) {
    const fallback = document.createElement('span');
    fallback.className = 'op-emoji'; fallback.textContent = emoji;
    if (!src) return fallback;
    const img = document.createElement('img');
    img.alt = ''; img.draggable = false; img.src = src;
    img.onerror = () => img.replaceWith(fallback);
    return img;
  }

  /* 프라이팬 */
  const pan = document.createElement('div');
  pan.className = 'op-pan';
  pan.appendChild(makeMedia(cfg.pan.src, cfg.pan.emoji));
  stage.appendChild(pan);

  /* 재료들 */
  const items = cfg.items;
  const n = items.length;
  const stride = [3, 5, 7, 2, 1].find((s) => gcd(s, n) === 1);     // 자리를 섞어서 좌우로 번갈아 튀게
  items.forEach((raw, i) => {
    const it = typeof raw === 'string' ? { name: raw } : raw;
    const name = it.name || '';
    const src = it.src || (cfg.dir + name + cfg.ext);
    const emoji = it.emoji || (cfg.emoji && cfg.emoji[name]) || '🍽️';
    const slot = (i * stride) % n;
    const num = (key, auto) => (it[key] !== undefined ? it[key] : auto);

    const x     = num('x',     lerp(-38, 38, (slot + 0.5) / n) + (rnd(i, 1) - 0.5) * 5);   // vw
    const y     = num('y',     12 + (slot % 3) * 6 + rnd(i, 2) * 4);                         // vh
    const size  = num('size',  lerp(13, 19, rnd(i, 3)));                                    // vmin
    const spin  = num('spin',  lerp(9, 18, rnd(i, 4)));                                     // 초
    const rise  = num('rise',  lerp(1.1, 1.6, rnd(i, 5)));                                  // 초
    const delay = num('delay', 0.4 + (n > 1 ? i * (1.4 / (n - 1)) : 0) + rnd(i, 6) * 0.15); // 초
    const bob   = num('bob',   lerp(3.2, 5.4, rnd(i, 7)));                                  // 초
    const amp   = lerp(1.2, 2.4, rnd(i, 8));                                                // vh
    const r0    = (rnd(i, 9) - 0.5) * 60;                                                   // 처음 기울기(도)

    const fly = document.createElement('div');
    fly.className = 'op-fly';
    fly.style.cssText =
      '--x:' + x + 'vw;--y:' + y + 'vh;--size:' + size + 'vmin;--spin:' + spin + 's;--rise:' + rise + 's;' +
      '--delay:' + delay + 's;--bob:' + bob + 's;--amp:' + amp + 'vh;--r0:' + r0 + 'deg;' +
      '--dir:' + (i % 2 ? 'reverse' : 'normal') + ';';
    fly.innerHTML = '<div class="op-bob"><div class="op-spin"></div><div class="op-shadow"></div></div>';
    fly.querySelector('.op-spin').appendChild(makeMedia(src, emoji));
    stage.appendChild(fly);
  });

  /* 화면을 톡 건드리면 로고와 버튼을 바로 보여줌 (연출 건너뛰기) */
  screen.addEventListener('pointerdown', () => screen.classList.add('revealed'));

  /* 시작하기 → 홈 화면 */
  document.getElementById('btn-opening-start').addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    document.getElementById('screen-home').classList.add('active');
  });
})();
