/* 실제 요리 도전: 요리 고르기 화면, 레시피 소개, 요리 중 레시피 힌트 */
(function () {
  const $ = (id) => document.getElementById(id);
  const A = window.GGApp;
  let filter = '전체';

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const typeOf = (id) => GG_DISH_TYPES.find((t) => t.id === id);
  const ingOf = (id) => GG_INGREDIENTS.find((i) => i.id === id);

  /** 완성 요리 사진 (없으면 요리 종류 이모지) */
  function dishPhoto(r, cls) {
    const wrap = document.createElement('div'); wrap.className = cls;
    const img = document.createElement('img');
    img.alt = ''; img.draggable = false; img.loading = 'lazy'; img.src = 'assets/dishes/' + r.id + '.png';
    img.onerror = () => { const e = document.createElement('span'); e.className = 'em'; e.textContent = typeOf(r.type).emoji; img.replaceWith(e); };
    wrap.appendChild(img);
    return wrap;
  }

  /* ---------- 요리 고르기 ---------- */
  function renderFilter() {
    const box = $('d-filter'); box.innerHTML = '';
    ['전체'].concat(GG_COUNTRIES).forEach((c) => {
      const b = document.createElement('button');
      b.className = 'k-tab' + (filter === c ? ' on' : ''); b.textContent = c;
      b.onclick = () => { filter = c; renderFilter(); renderGrid(); };
      box.appendChild(b);
    });
  }

  function renderGrid() {
    const g = $('d-grid'); g.innerHTML = ''; g.scrollTop = 0;
    GG_RECIPES.filter((r) => filter === '전체' || r.country === filter).forEach((r) => {
      const c = document.createElement('button');
      c.className = 'd-card';
      c.appendChild(dishPhoto(r, 'ph'));
      c.insertAdjacentHTML('beforeend', '<div class="nm">' + esc(r.name) + '</div><div class="meta">' + esc(r.country) + ' · ' + esc(typeOf(r.type).name) + '</div>');
      c.onclick = () => openIntro(r);
      g.appendChild(c);
    });
  }

  /* ---------- 레시피 소개 (도전하기 전) ---------- */
  function openIntro(r) {
    const must = r.ing.filter((t) => !(t[2] && t[2].opt) && ingOf(t[0])).map((t) => {
      const names = [t[0]].concat((t[2] && t[2].alt) || []).filter(ingOf).map((id) => ingOf(id).name);      // 대신 써도 되는 재료는 / 로 같이 보여줌
      return '<span class="tag">' + esc(names.join(' / ')) + '</span>';
    }).join('');
    const m = $('d-modal');
    m.innerHTML = '<div class="modal-card dish-intro"><div class="di-photo"></div>' +
      '<div class="di-body"><div class="di-meta">' + esc(r.country) + ' · ' + esc(typeOf(r.type).name) + '</div>' +
      '<h2>' + esc(r.name) + '</h2><p class="di-story">' + esc(r.intro) + '</p>' +
      '<div class="di-label">꼭 들어가는 재료</div><div class="tags">' + must + '</div>' +
      '<div class="di-btns"><button class="m-ghost" id="di-close">닫기</button><button class="m-go" id="di-go">도전하기</button></div></div></div>';
    m.querySelector('.di-photo').appendChild(dishPhoto(r, 'ph'));
    m.hidden = false;
    $('di-close').onclick = () => { m.hidden = true; };
    $('di-go').onclick = () => { m.hidden = true; A.startReal(r); };
  }

  /* ---------- 요리 중 레시피 힌트 ---------- */
  function openHint() {
    const r = A.state.recipe; if (!r) return;
    const list = r.ing.filter((t) => ingOf(t[0])).map((t) => ({ ing: ingOf(t[0]), amt: t[1], o: t[2] || {} }));
    const Wr = list.reduce((s, x) => s + GGCalc.grams(x.ing, x.amt), 0) || 1;
    const rows = list.map((x) => {
      const pct = GGCalc.round(GGCalc.grams(x.ing, x.amt) / Wr * 100, 1);
      const alt = (x.o.alt || []).filter(ingOf).map((id) => ingOf(id).name).join(', ');
      return '<li class="' + (x.o.opt ? 'opt' : '') + '"><span class="n">' + esc(x.ing.name) + (x.o.opt ? ' <small>있으면 좋아요</small>' : '') +
        (alt ? '<small class="alt">대신 써도 돼요: ' + esc(alt) + '</small>' : '') + '</span>' +
        '<span class="a">' + GGCalc.amountText(x.amt, x.ing.unit) + '</span><span class="p">' + pct + '%</span></li>';
    }).join('');
    const m = $('hint-modal');
    m.innerHTML = '<div class="modal-card hint"><h2>' + esc(r.name) + ' 레시피 힌트</h2>' +
      '<p class="h-note">2인분 기준이에요. 집마다 레시피가 달라서 <b>비슷하면</b> 괜찮아요! 양보다 <b>비율(%)</b>이 중요해요.</p>' +
      '<div class="h-head"><span>재료</span><span>양</span><span>비율</span></div><ul class="h-list">' + rows + '</ul>' +
      '<div class="di-btns"><button class="m-go" id="h-close">닫기</button></div></div>';
    m.hidden = false;
    $('h-close').onclick = () => { m.hidden = true; };
  }

  /* ---------- 연결 ---------- */
  $('btn-real').onclick = () => A.requirePlayer(() => { A.show('screen-dishes'); renderFilter(); renderGrid(); });
  $('dishes-back').onclick = () => A.show('screen-home');
  $('btn-hint').onclick = openHint;
  [$('d-modal'), $('hint-modal')].forEach((m) => m.addEventListener('click', (e) => { if (e.target === m) m.hidden = true; }));   // 바깥을 누르면 닫힘
})();
