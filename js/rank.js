/* 랭킹 화면: 개인전 / 모둠전, 창작 / 실제 요리 (100점 만점 합계 기준, 이 기기에 저장된 기록만) */
(function () {
  const $ = (id) => document.getElementById(id);
  const A = window.GGApp;
  let kind = 'solo';          // 'solo' 개인전, 'team' 모둠전
  let mode = 'all';           // 'all' 전체, 'creative' 창작 요리, 'real' 실제 요리 도전
  const KINDS = [['solo', '개인전'], ['team', '모둠전']];
  const MODES = [['all', '전체'], ['creative', '창작 요리'], ['real', '실제 요리 도전']];

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function tabs(boxId, list, current, onPick) {
    const box = $(boxId); box.innerHTML = '';
    list.forEach(([id, label]) => {
      const b = document.createElement('button');
      b.className = 'k-tab' + (current === id ? ' on' : ''); b.textContent = label;
      b.onclick = () => onPick(id);
      box.appendChild(b);
    });
  }

  function render() {
    tabs('rank-kinds', KINDS, kind, (id) => { kind = id; render(); });
    tabs('rank-modes', MODES, mode, (id) => { mode = id; render(); });
    const list = GGStore.board(kind, mode);
    const box = $('rank-list'); box.innerHTML = '';
    const hidden = GGStore.hiddenCount();
    $('rank-note').textContent = (kind === 'team' ? '모둠별로 가장 높은 점수가 막대로 비교돼요. (100점 만점)' : '참가자별로 가장 높은 점수가 보여요. (100점 만점)') +
      (hidden ? '  ※ 심사 셰프 수가 달랐던 예전 기록 ' + hidden + '개는 비교할 수 없어서 숨겨져 있어요.' : '');
    if (!list.length) {
      box.innerHTML = '<div class="rk-empty">아직 기록이 없어요.<br>요리를 만들어 심사를 받으면 여기에 나타나요!</div>';
      return;
    }
    list.slice(0, 30).forEach((r, i) => {
      const d = new Date(r.ts);
      const sub = r.mode === 'real'
        ? '실제 요리 도전' + (r.sim != null ? ' · ' + r.sim + '% 비슷' : '')
        : '창작 요리';
      const who = r.pType === 'team' && r.members && r.members.length ? '<small>' + esc(r.members.join(' · ')) + '</small>' : '';
      const row = document.createElement('div');
      row.className = 'rk-row r' + (i < 3 ? i + 1 : 0);
      row.innerHTML =
        '<div class="rk-no">' + (i + 1) + '</div>' +
        '<div class="rk-main"><div class="rk-name">' + esc(r.pName) + who + '</div>' +
        '<div class="rk-dish">' + esc(r.dish) + ' · ' + sub + ' · ' + (d.getMonth() + 1) + '/' + d.getDate() + '</div></div>' +
        '<div class="rk-bar"><div class="rk-fill" style="width:' + Math.max(2, r.total) + '%"></div></div>' +
        '<div class="rk-score">' + r.total + '<small>점</small></div>';
      box.appendChild(row);
    });
  }

  function open(initialKind) {
    if (initialKind) kind = initialKind;
    render();
    A.show('screen-rank');
  }

  $('btn-rank').onclick = () => open();
  $('rank-back').onclick = () => A.show('screen-home');
  $('rank-clear').onclick = () => {
    if (!GGStore.all().length) return;
    if (confirm('이 기기에 저장된 모든 점수 기록을 지울까요?\n(지우면 되돌릴 수 없어요)')) { GGStore.clear(); render(); }
  };
  A.showRank = open;
})();
