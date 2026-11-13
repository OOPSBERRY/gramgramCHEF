/* 화면 흐름과 요리 화면: 재료 고르기, 양 정하기, 가격 계산, 후라이팬에 재료 떨어뜨리기 */
(function () {
  const $ = (id) => document.getElementById(id);
  const BUDGETS = [null, 3000, 5000, 10000];   // null = 제한 없음
  const PHOTO_DIR = 'assets/ingredients/';     // 재료 사진 폴더 (파일 이름 = 재료 id.png)

  const state = {
    tab: GG_CATEGORIES[0].id,
    items: [],          // { ing, amount(기본단위), unit(보여줄 단위) }
    budget: null,
    mode: 'creative',   // 'creative'(창작) 또는 'real'(실제 요리 도전)
    recipe: null        // 실제 요리 도전일 때 고른 레시피
  };

  /* ---------- 화면 전환 ---------- */
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    $(id).classList.add('active');
  }
  $('btn-creative').onclick = () => {
    if (state.mode !== 'creative') state.items = [];            // 다른 모드에서 왔으면 재료를 비우고 시작
    state.mode = 'creative'; state.recipe = null;
    show('screen-kitchen'); renderAll();
  };
  $('btn-home').onclick = () => show(state.mode === 'real' ? 'screen-dishes' : 'screen-home');

  /* ---------- 재료 사진 (파일이 없으면 이모지로 대신 보임) ---------- */
  function photo(ing) {
    const emoji = document.createElement('span');
    emoji.className = 'em'; emoji.textContent = ing.emoji;
    const img = document.createElement('img');
    img.alt = ''; img.draggable = false; img.loading = 'lazy'; img.src = PHOTO_DIR + ing.id + '.png';
    img.onerror = () => img.replaceWith(emoji);
    return img;
  }

  /* ---------- 예산 선택 ---------- */
  function renderBudget() {
    const box = $('budget-select');
    box.innerHTML = '<span class="lbl">예산</span>';
    BUDGETS.forEach((b) => {
      const c = document.createElement('button');
      c.className = 'chip' + (state.budget === b ? ' on' : '');
      c.textContent = b === null ? '제한 없음' : b.toLocaleString('ko-KR') + '원';
      c.onclick = () => { state.budget = b; renderBudget(); updateTotals(); };
      box.appendChild(c);
    });
    const inp = document.createElement('input');
    inp.type = 'number'; inp.className = 'budget-input'; inp.placeholder = '직접 입력'; inp.min = 0; inp.inputMode = 'numeric';
    if (state.budget !== null && !BUDGETS.includes(state.budget)) inp.value = state.budget;
    inp.oninput = () => {
      const v = parseInt(inp.value, 10);
      state.budget = v > 0 ? v : null;
      box.querySelectorAll('.chip').forEach((c, i) => c.classList.toggle('on', BUDGETS[i] === state.budget));
      updateTotals();
    };
    box.appendChild(inp);
  }

  /* ---------- 재료 선반 ---------- */
  function renderTabs() {
    const t = $('tabs'); t.innerHTML = '';
    GG_CATEGORIES.forEach((c) => {
      const b = document.createElement('button');
      b.className = 'k-tab' + (state.tab === c.id ? ' on' : '');
      b.textContent = c.name;
      b.onclick = () => { state.tab = c.id; renderTabs(); renderGrid(); };
      t.appendChild(b);
    });
  }

  function renderGrid() {
    const g = $('grid'); g.innerHTML = ''; g.scrollTop = 0;
    GG_INGREDIENTS.filter((i) => i.cat === state.tab).forEach((ing) => {
      const inPot = state.items.some((it) => it.ing.id === ing.id);
      const d = document.createElement('button');
      d.className = 'k-card' + (inPot ? ' in' : '');
      d.dataset.id = ing.id;
      const ph = document.createElement('div'); ph.className = 'ph'; ph.appendChild(photo(ing));
      d.appendChild(ph);
      d.insertAdjacentHTML('beforeend',
        '<div class="nm">' + ing.name + '</div>' +
        '<div class="pr">' + (ing.price === 0 ? '공짜' : '100' + ing.unit + ' ' + ing.price.toLocaleString('ko-KR') + '원') + '</div>');
      d.onclick = () => addIngredient(ing);
      g.appendChild(d);
    });
  }

  function addIngredient(ing) {
    if (state.items.some((it) => it.ing.id === ing.id)) { flashRow(ing.id); return; }   // 이미 담았으면 그 줄을 깜빡여서 알려줌
    state.items.push({ ing, amount: ing.def, unit: ing.unit });
    renderGrid(); renderPot();
    dropIntoPan(ing, true);
    if (window.GGSound) GGSound.play('pop');
    flashRow(ing.id);
  }

  function removeIngredient(id) {
    state.items = state.items.filter((it) => it.ing.id !== id);
    const slot = $('pile').querySelector('[data-id="' + id + '"]');
    if (slot) slot.remove();
    renderGrid(); renderPot();
  }

  /* ---------- 후라이팬 (담은 재료가 떨어져서 쌓임) ---------- */
  function hash(str, k) {                       // 재료마다 항상 같은 자리를 주는 간단한 값 (0~1)
    let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100003;
    const s = Math.sin(h * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s);
  }

  function dropIntoPan(ing, animate) {
    const pile = $('pile');
    const old = pile.querySelector('[data-id="' + ing.id + '"]');
    if (old) old.remove();
    // 팬 안쪽 타원 안의 한 지점 (상자 크기에 대한 %)
    const a = hash(ing.id, 1) * Math.PI * 2, r = Math.sqrt(hash(ing.id, 2));
    const x = 40 + Math.cos(a) * r * 24, y = 57 + Math.sin(a) * r * 12;
    const rot = (hash(ing.id, 3) - 0.5) * 70;
    const slot = document.createElement('div');
    slot.className = 'slot'; slot.dataset.id = ing.id;
    slot.style.left = x + '%'; slot.style.top = y + '%';
    slot.style.zIndex = pile.children.length + 1;
    const it0 = state.items.find((x) => x.ing.id === ing.id);
    if (it0) setSlotSize(slot, it0);
    const inner = document.createElement('div');
    inner.style.transform = 'rotate(' + rot + 'deg)';
    inner.appendChild(photo(ing));
    slot.appendChild(inner); pile.appendChild(slot);
    if (animate) { const pb = $('panbox'); pb.classList.remove('bump'); void pb.offsetWidth; pb.classList.add('bump'); }
    if (animate && inner.animate) {              // 위에서 툭 떨어져서 살짝 튕김
      inner.animate([
        { transform: 'translateY(-170px) rotate(' + (rot - 60) + 'deg) scale(1.2)', opacity: 0 },
        { opacity: 1, offset: .15 },
        { transform: 'translateY(0) rotate(' + rot + 'deg) scale(1)', offset: .72 },
        { transform: 'translateY(-12px) rotate(' + rot + 'deg) scale(1.03)', offset: .86 },
        { transform: 'translateY(0) rotate(' + rot + 'deg) scale(1)', opacity: 1 }
      ], { duration: 650, easing: 'cubic-bezier(.4, 0, .6, 1)' });
    }
  }

  /** 양이 많을수록 커지고(최대 슬라이더 값 기준), 0이면 흐리게 */
  function setSlotSize(slot, it) {
    const r = Math.min(1.6, Math.max(0, it.amount / it.ing.max));
    slot.style.setProperty('--s', (0.55 + 0.8 * Math.sqrt(r)).toFixed(2));
    slot.classList.toggle('zero', it.amount <= 0);
  }
  function updatePileSize(it) {
    const slot = $('pile').querySelector('[data-id="' + it.ing.id + '"]');
    if (slot) setSlotSize(slot, it);
  }

  function rebuildPile() {
    $('pile').innerHTML = '';
    state.items.forEach((it) => dropIntoPan(it.ing, false));
  }

  /* ---------- 내 재료 목록 ---------- */
  function renderPot() {
    const list = $('pot-list'); list.innerHTML = '';
    if (!state.items.length) {
      list.innerHTML = '<div class="k-empty">왼쪽에서 재료를 눌러<br>후라이팬에 넣어 보세요!</div>';
    }
    state.items.forEach((it) => list.appendChild(buildRow(it)));
    updateTotals();
  }

  function buildRow(it) {
    const ing = it.ing, [small, big] = GGCalc.unitPair(ing.unit);
    const row = document.createElement('div');
    row.className = 'row'; row.dataset.id = ing.id;
    row.innerHTML =
      '<div class="row-top"><div class="row-thumb"></div>' +
      '<div class="row-names"><div class="row-name">' + ing.name + '</div><div class="formula"></div></div>' +
      '<button class="del" aria-label="빼기">✕</button></div>' +
      '<div class="row-mid"><div class="slider-wrap">' +
      '<input type="range" min="0" max="' + ing.max + '" step="' + ing.step + '">' +
      '<div class="range-lbl"><span></span><span></span></div></div>' +
      '<div class="amt"><input type="number" min="0" step="any" inputmode="decimal">' +
      '<div class="unit-toggle"><button data-u="' + small + '">' + small + '</button><button data-u="' + big + '">' + big + '</button></div></div></div>';
    row.querySelector('.row-thumb').appendChild(photo(ing));

    const slider = row.querySelector('input[type=range]');
    const num = row.querySelector('input[type=number]');

    slider.oninput = () => { it.amount = parseFloat(slider.value); refreshRow(it, row, 'slider'); updateTotals(); };
    num.oninput = () => {
      const v = parseFloat(num.value);
      it.amount = (isFinite(v) && v >= 0) ? Math.min(GGCalc.fromDisplay(v, it.unit), 100000) : 0;
      refreshRow(it, row, 'num'); updateTotals();
    };
    num.onchange = () => refreshRow(it, row);                  // 입력을 마치면 숫자를 깔끔하게 정리
    num.onfocus = () => num.select();
    row.querySelectorAll('.unit-toggle button').forEach((b) => {
      b.onclick = () => { it.unit = b.dataset.u; refreshRow(it, row); };
    });
    row.querySelector('.del').onclick = () => removeIngredient(ing.id);

    refreshRow(it, row);
    return row;
  }

  /** 한 줄의 표시 갱신. from='num'이면 숫자칸은 건드리지 않음(입력 중 방해 방지) */
  function refreshRow(it, row, from) {
    const ing = it.ing;
    const slider = row.querySelector('input[type=range]');
    const num = row.querySelector('input[type=number]');
    if (from !== 'slider') slider.value = Math.min(it.amount, ing.max);
    if (from !== 'num') num.value = GGCalc.toDisplay(it.amount, it.unit);
    row.querySelectorAll('.unit-toggle button').forEach((b) => b.classList.toggle('on', b.dataset.u === it.unit));
    const lbl = row.querySelectorAll('.range-lbl span');
    lbl[0].textContent = '0';
    lbl[1].textContent = GGCalc.toDisplay(ing.max, it.unit) + it.unit;
    updatePileSize(it);
    // 재료 하나의 원가는 보여 주지 않음: 계산 확인 화면에서 학생이 소수의 곱셈으로 직접 구함. 가격(100g당)만 보여 줌
    const price = ing.price.toLocaleString('ko-KR');
    row.querySelector('.formula').innerHTML = ing.price === 0
      ? '<div class="f1">' + ing.name + '은(는) 공짜예요</div>'
      : '<div class="f1">100' + ing.unit + '당 ' + price + '원</div>';
  }

  function flashRow(id) {
    const row = document.querySelector('.row[data-id="' + id + '"]');
    if (!row) return;
    row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    row.classList.add('flash');
    setTimeout(() => row.classList.remove('flash'), 600);
  }

  /* ---------- 합계와 예산 ---------- */
  function updateTotals() {
    const cost = GGCalc.totalCost(state.items);
    $('sum-count').textContent = state.items.length + '가지';
    $('btn-submit').disabled = !state.items.some((it) => it.amount > 0);      // 양이 있는 재료가 하나라도 있어야 제출 가능

    const meter = $('budget-meter');
    if (state.budget === null) { meter.hidden = true; return; }
    meter.hidden = false;
    const ratio = cost / state.budget;
    const fill = $('budget-fill'), text = $('budget-text');
    fill.style.width = Math.min(ratio, 1) * 100 + '%';
    fill.className = 'k-fill' + (ratio > 1 ? ' over' : ratio > 0.8 ? ' warn' : '');
    text.className = 'k-meter-text' + (ratio > 1 ? ' over' : '');
    // 남은 금액은 숫자로 보여 주지 않음 (총 원가를 학생이 직접 계산하도록). 예산 안인지만 알려 줌
    text.textContent = ratio > 1
      ? '예산 ' + GGCalc.won(state.budget) + '을 넘었어요! 재료를 줄여 봐요'
      : '예산 ' + GGCalc.won(state.budget) + ' 안이에요';
  }

  $('btn-clear').onclick = () => {
    if (!state.items.length) return;
    if (confirm('후라이팬의 재료를 모두 비울까요?')) { state.items = []; $('pile').innerHTML = ''; renderGrid(); renderPot(); }
  };

  /* 후라이팬 사진이 없으면 이모지로 대신 보임 */
  $('pan-img').onerror = function () {
    const s = document.createElement('div'); s.className = 'em'; s.style.cssText = 'font-size:120px;text-align:center'; s.textContent = '🍳';
    this.replaceWith(s);
  };

  /* 태블릿 키보드가 올라와도 입력 중인 칸이 보이도록 가운데로 스크롤 */
  document.addEventListener('focusin', (e) => {
    if (e.target && e.target.tagName === 'INPUT' && e.target.type !== 'range') setTimeout(() => { try { e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (err) { /* 무시 */ } }, 320);
  });

  function renderAll() {
    const real = state.mode === 'real' && state.recipe;
    $('k-title').textContent = real ? '도전: ' + state.recipe.name + ' (' + state.recipe.country + ')' : '창작 요리';
    $('btn-hint').hidden = !real;
    $('btn-home').textContent = real ? '요리 고르기' : '처음으로';
    renderBudget(); renderTabs(); renderGrid(); renderPot(); rebuildPile();
  }

  /* 다른 파일(제출·결과 화면)에서 쓸 수 있게 내보냄 */
  window.GGApp = {
    show,
    state,
    photo,
    showKitchen: () => { show('screen-kitchen'); renderAll(); },
    newDish: () => { state.items = []; show('screen-kitchen'); renderAll(); },      // 재료를 비우고 새 요리 시작 (예산은 유지)
    startReal: (recipe) => { state.mode = 'real'; state.recipe = recipe; state.items = []; show('screen-kitchen'); renderAll(); },
    showDishes: () => show('screen-dishes')
  };
})();
