/* 참가자 정하기: 개인전(이름 1개) 또는 모둠전(모둠 이름 + 모둠원 이름들) */
(function () {
  const $ = (id) => document.getElementById(id);
  const A = window.GGApp;
  const MAX_MEMBERS = 6, NAME_MAX = 8, TEAM_MAX = 12;
  const LAST_KEY = 'gramgram_last_player_v1';

  let type = 'solo';
  let members = ['', '', ''];          // 모둠원 입력칸 내용
  let pending = null;                  // 시작하기를 누르면 이어서 할 일
  let backTo = 'screen-home';          // 돌아가기를 누르면 갈 화면

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lastGet = () => { try { return JSON.parse(localStorage.getItem(LAST_KEY)) || null; } catch (e) { return null; } };
  const lastSet = (p) => { try { localStorage.setItem(LAST_KEY, JSON.stringify(p)); } catch (e) { /* 무시 */ } };

  /** 화면 위쪽의 "누가 도전 중" 버튼들 갱신 */
  function updateWho() {
    const p = A.state.player;
    const text = !p ? '' : p.type === 'team' ? p.name + ' (' + p.members.length + '명)' : p.name;
    ['btn-who', 'btn-who2'].forEach((id) => { const b = $(id); if (b) { b.hidden = !p; b.textContent = text; } });
  }

  /* ---------- 입력 화면 ---------- */
  function renderTypes() {
    document.querySelectorAll('.pl-type').forEach((b) => b.classList.toggle('on', b.dataset.t === type));
  }

  function syncMembers() { document.querySelectorAll('.pl-member').forEach((inp, i) => { members[i] = inp.value; }); }

  function renderForm() {
    const f = $('pl-form');
    if (type === 'solo') {
      const val = $('pl-name') ? $('pl-name').value : '';
      f.innerHTML = '<div class="pl-label">내 이름</div><input id="pl-name" class="pl-input" maxlength="' + NAME_MAX + '" placeholder="이름을 적어요 (' + NAME_MAX + '글자까지)" autocomplete="off">';
      $('pl-name').value = val;
    } else {
      const teamVal = $('pl-team') ? $('pl-team').value : '';
      let h = '<div class="pl-label">모둠 이름</div><input id="pl-team" class="pl-input" maxlength="' + TEAM_MAX + '" placeholder="모둠 이름 (' + TEAM_MAX + '글자까지)" autocomplete="off">' +
        '<div class="pl-label">모둠원 이름 <small>(최대 ' + MAX_MEMBERS + '명)</small></div><div class="pl-members">';
      members.forEach((m, i) => {
        h += '<div class="pl-mrow"><input class="pl-input pl-member" maxlength="' + NAME_MAX + '" placeholder="모둠원 ' + (i + 1) + '" value="' + esc(m) + '" autocomplete="off">' +
          (members.length > 1 ? '<button class="pl-del" data-i="' + i + '" aria-label="지우기">✕</button>' : '') + '</div>';
      });
      h += '</div>' + (members.length < MAX_MEMBERS ? '<button class="pl-add" id="pl-add">+ 모둠원 추가</button>' : '');
      f.innerHTML = h;
      $('pl-team').value = teamVal;
      $('pl-add') && ($('pl-add').onclick = () => { syncMembers(); members.push(''); renderForm(); });
      f.querySelectorAll('.pl-del').forEach((b) => { b.onclick = () => { syncMembers(); members.splice(parseInt(b.dataset.i, 10), 1); renderForm(); }; });
    }
  }

  function renderRecent() {
    const box = $('pl-recent'); box.innerHTML = '';
    const list = GGStore.recent(type, 6);
    if (!list.length) return;
    box.insertAdjacentHTML('beforeend', '<div class="pl-label">이전에 했던 ' + (type === 'solo' ? '이름' : '모둠') + ' (눌러서 불러오기)</div>');
    const row = document.createElement('div'); row.className = 'pl-chips';
    list.forEach((r) => {
      const b = document.createElement('button'); b.className = 'pl-chip'; b.textContent = r.name;
      b.onclick = () => {
        if (type === 'solo') $('pl-name').value = r.name;
        else { members = r.members.length ? r.members.slice() : ['']; renderForm(); $('pl-team').value = r.name; }
        $('pl-msg').textContent = '';
      };
      row.appendChild(b);
    });
    box.appendChild(row);
  }

  function openPlayer(then) {
    const cur = document.querySelector('.screen.active');
    backTo = cur && cur.id !== 'screen-player' ? cur.id : 'screen-home';
    pending = then || null;
    const p = A.state.player || lastGet();
    if (p) {
      type = p.type;
      members = p.type === 'team' ? (p.members.length ? p.members.slice() : ['']) : ['', '', ''];
    }
    $('pl-msg').textContent = '';
    renderTypes(); renderForm();
    if (p) { if (type === 'solo') $('pl-name').value = p.name; else $('pl-team').value = p.name; }
    renderRecent();
    A.show('screen-player');
  }

  function start() {
    let player;
    if (type === 'solo') {
      const name = $('pl-name').value.trim();
      const f = GGFilter.check(name, '이름', NAME_MAX);
      if (!f.ok) { $('pl-msg').textContent = f.msg; return; }
      player = { type: 'solo', name, members: [] };
    } else {
      syncMembers();
      const team = $('pl-team').value.trim();
      const ft = GGFilter.check(team, '모둠 이름', TEAM_MAX);
      if (!ft.ok) { $('pl-msg').textContent = ft.msg; return; }
      const names = members.map((m) => m.trim()).filter(Boolean);
      if (!names.length) { $('pl-msg').textContent = '모둠원 이름을 한 명 이상 적어 주세요.'; return; }
      for (const n of names) {
        const f = GGFilter.check(n, '모둠원 이름', NAME_MAX);
        if (!f.ok) { $('pl-msg').textContent = f.msg; return; }
      }
      player = { type: 'team', name: team, members: names };
    }
    A.state.player = player; lastSet(player); updateWho();
    const go = pending; pending = null;
    if (go) go(); else A.show(backTo);
  }

  /* ---------- 연결 ---------- */
  document.querySelectorAll('.pl-type').forEach((b) => {
    b.onclick = () => { if (type === 'team') syncMembers(); type = b.dataset.t; $('pl-msg').textContent = ''; renderTypes(); renderForm(); renderRecent(); };
  });
  $('pl-go').onclick = start;
  $('pl-back').onclick = () => { pending = null; A.show(backTo); };
  ['btn-who', 'btn-who2'].forEach((id) => { $(id).onclick = () => { const here = document.querySelector('.screen.active').id; openPlayer(() => A.show(here)); }; });

  /* 다른 파일에서 쓰는 함수: 참가자가 정해져 있으면 바로, 아니면 정하고 나서 이어서 실행 */
  A.requirePlayer = (then) => { if (A.state.player) then(); else openPlayer(then); };
  A.openPlayer = openPlayer;
})();
