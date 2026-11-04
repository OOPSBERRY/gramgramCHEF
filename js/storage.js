/* 점수 기록 저장 (브라우저의 localStorage). 이 기기 안에서만 저장되고 랭킹도 이 기기 안에서만 비교돼요. */
const GGStore = (function () {
  const KEY = 'gramgram_records_v1';
  const MAX = 1000;                       // 너무 많이 쌓이지 않게 오래된 기록부터 지움
  let mem = null;                         // localStorage 를 못 쓰는 환경에서도 앱이 멈추지 않도록 메모리에도 들고 있음

  function load() {
    if (mem) return mem;
    try {
      const s = localStorage.getItem(KEY);
      mem = s ? JSON.parse(s) : [];
      if (!Array.isArray(mem)) mem = [];
    } catch (e) { mem = []; }
    return mem;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); return true; } catch (e) { return false; } }

  /** 기록 하나 추가. rec: { pType('solo'|'team'), pName, members[], mode, dish, total, ... } */
  function add(rec) {
    load();
    rec.id = Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    rec.ts = Date.now();
    mem.push(rec);
    if (mem.length > MAX) mem.splice(0, mem.length - MAX);
    save();
    return rec;
  }

  function clear() { mem = []; try { localStorage.removeItem(KEY); } catch (e) { /* 무시 */ } }

  /** 지금 심사하는 셰프 수 (셰프가 늘면 예전 기록과 점수 기준이 달라서, 같은 수로 심사한 기록끼리만 비교해요) */
  const chefNow = () => (typeof GG_CHEFS !== 'undefined' ? GG_CHEFS.filter((c) => c.ready).length : 0);
  const comparable = (r) => !chefNow() || r.chefCount === chefNow();
  const keyOf = (r) => r.pType + ':' + String(r.pName || '').trim().toLowerCase();

  /** 랭킹표: 참가자(또는 모둠)마다 가장 높은 기록 하나씩, 점수 높은 순 (같으면 먼저 한 쪽이 위) */
  function board(pType, mode) {
    const best = new Map();
    load().filter((r) => comparable(r) && r.pType === pType && (!mode || mode === 'all' || r.mode === mode)).forEach((r) => {
      const k = keyOf(r), b = best.get(k);
      if (!b || r.total > b.total || (r.total === b.total && r.ts < b.ts)) best.set(k, r);
    });
    return Array.from(best.values()).sort((a, b) => b.total - a.total || a.ts - b.ts);
  }

  /** 이번 기록이 전체에서 몇 위인지 (다른 참가자들의 최고 기록과 비교) */
  function rankInfo(rec) {
    const others = board(rec.pType, 'all').filter((r) => keyOf(r) !== keyOf(rec));
    return { rank: others.filter((o) => o.total > rec.total).length + 1, of: others.length + 1 };
  }

  /** 최근에 쓴 이름 (다시 입력하지 않고 누르기만 하면 되도록) */
  function recent(pType, limit) {
    const seen = new Set(), out = [];
    load().slice().reverse().forEach((r) => {
      if (r.pType !== pType) return;
      const k = keyOf(r);
      if (seen.has(k) || out.length >= limit) return;
      seen.add(k); out.push({ name: r.pName, members: r.members || [] });
    });
    return out;
  }

  return { add, clear, board, rankInfo, recent, all: () => load().slice(), hiddenCount: () => load().filter((r) => !comparable(r)).length };
})();
