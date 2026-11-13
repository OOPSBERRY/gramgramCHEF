/* 그램 셰프의 소수 곱셈 문제 (5학년 수학: 소수의 곱셈 복습)
   학생이 넣은 재료 중 2~3개를 골라 원가·무게 문제를 만든다. 화면과 분리된 순수 계산.
   문제 유형
     A 자연수 × 소수 : 감자 150g, 1g에 1.5원        → 150 × 1.5 (원)
     B 소수 × 자연수 : 감자 0.15kg, 1kg에 1500원     → 0.15 × 1500 (원)
     C 소수 × 소수   : 우유 0.2L, 1L의 무게 1.03kg   → 0.2 × 1.03 (kg)
     W 자연수 × 소수 : 간장 15mL, 1mL의 무게 1.15g   → 15 × 1.15 (g)            */
const GGCalcQuiz = (function () {
  const MAX = 3;
  const BIG = { g: 'kg', mL: 'L' };

  /** 소수 계산 오차 없애기 (0.1 × 3 = 0.30000000000000004 같은 것) */
  const fix = (n) => Math.round(n * 1e6) / 1e6;
  /** 숫자를 식에 쓰는 모양으로 (1500, 0.15, 1.03) */
  const num = (n) => String(fix(n));

  function shuffle(a) {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
    return b;
  }

  /** 원가 문제. preferA 가 참이면 A(1g당 가격)를 먼저, 아니면 B(kg으로 바꾸기)를 먼저 시도 */
  function costQ(it, preferA, strict) {
    const ing = it.ing, u = ing.unit, U = BIG[u], amt = it.amount;
    if (!(ing.price > 0) || !(amt > 0)) return null;
    const perOne = fix(ing.price / 100);                 // 1g(1mL)당 가격
    const canA = perOne !== Math.round(perOne);          // 1g당 가격이 소수일 때만 소수 곱셈이 됨
    // kg으로 바꾸면 소수가 될 때만. strict(첫 바퀴)에서는 0.1kg 이상이고 1kg당 가격이 1000, 10000 같은 수가 아닐 때만
    // (0.015kg 처럼 작은 수, 0.1 × 1000 처럼 소수점만 옮기면 되는 문제는 다른 재료가 없을 때만 냄)
    const tenPow = /^10*$/.test(String(ing.price * 10));
    const canB = amt % 1000 !== 0 && (!strict || (amt >= 100 && !tenPow));
    const type = (preferA && canA) ? 'A' : canB ? 'B' : canA ? 'A' : null;
    if (!type) return null;
    const base = { item: it, kind: 'cost', type, unit: '원', ask: ing.name + ' 값은 얼마일까요?' };
    if (type === 'A') {
      return Object.assign(base, { a: amt, b: perOne, answer: fix(amt * perOne),
        facts: ['넣은 양: ' + num(amt) + u, ing.name + ' 1' + u + '의 값: ' + num(perOne) + '원'] });
    }
    const a = fix(amt / 1000), b = ing.price * 10;       // kg(L), 1kg(1L)당 가격
    return Object.assign(base, { a, b, answer: fix(a * b),
      facts: ['넣은 양: ' + num(amt) + u + ' = ' + num(a) + U, ing.name + ' 1' + U + '의 값: ' + num(b) + '원'] });
  }

  /** 무게 문제 (mL 재료 → 무게). 100mL 이상이면 L·kg으로(C), 적으면 mL·g으로(W) */
  function weightQ(it) {
    const ing = it.ing, d = ing.density || 1, amt = it.amount;
    const base = { item: it, kind: 'weight', ask: ing.name + ' 무게는 얼마일까요?' };
    if (amt >= 100 && amt % 1000 !== 0) {
      const a = fix(amt / 1000);
      return Object.assign(base, { type: 'C', a, b: d, unit: 'kg', answer: fix(a * d),
        facts: ['넣은 양: ' + num(amt) + 'mL = ' + num(a) + 'L', ing.name + ' 1L의 무게: ' + num(d) + 'kg'] });
    }
    return Object.assign(base, { type: 'W', a: amt, b: d, unit: 'g', answer: fix(amt * d),
      facts: ['넣은 양: ' + num(amt) + 'mL', ing.name + ' 1mL의 무게: ' + num(d) + 'g'] });
  }

  /** 재료 목록으로 문제 2~3개 만들기 (재료 하나에 문제 하나). 소수 곱셈이 안 되는 재료뿐이면 빈 목록 */
  function build(items) {
    const pool = shuffle(items.filter((it) => it.amount > 0));
    const used = new Set(), cost = [];
    // 무게 문제: 1mL 무게가 1이 아닌 액체(우유, 간장, 기름 등)가 있으면 하나
    const liq = pool.find((it) => it.ing.unit === 'mL' && Math.abs((it.ing.density || 1) - 1) > 1e-9);
    const weight = liq ? weightQ(liq) : null;
    if (weight) used.add(liq);
    const need = weight ? MAX - 1 : MAX;
    // 원가 문제: A와 B가 번갈아 나오게
    // 첫 바퀴는 숫자가 알맞은 재료만, 모자라면 두 번째 바퀴에서 나머지도
    let preferA = Math.random() < 0.5;
    [true, false].forEach((strict) => {
      for (const it of pool) {
        if (cost.length >= need) break;
        if (used.has(it)) continue;
        const q = costQ(it, preferA, strict);
        if (!q) continue;
        cost.push(q); used.add(it); preferA = q.type !== 'A';
      }
    });
    return weight ? cost.concat(weight) : cost;
  }

  /** 학생이 적은 답 읽기 ("1,500" "225." 도 받아 줌). 숫자가 아니면 NaN */
  function parse(text) {
    const s = String(text).replace(/[,\s원gkLm]/g, '');
    return s === '' ? NaN : Number(s);
  }

  function isRight(q, text) {
    const v = parse(text);
    return isFinite(v) && Math.abs(v - q.answer) < 1e-6;
  }

  /* ================= 힌트: 틀린 숫자를 보고 어떤 실수였는지 짐작 ================= */
  const PLACE = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱'];
  const near = (x, y) => Math.abs(x - y) < 1e-6 * Math.max(1, Math.abs(y));

  /** 소수를 '소수점 뗀 자연수'와 '소수 자리 수'로 (0.15 → 15, 2자리) */
  function split(n) {
    const s = num(n), i = s.indexOf('.');
    return i < 0 ? { int: Number(s), dp: 0 } : { int: Number(s.replace('.', '')), dp: s.length - i - 1 };
  }
  const dpText = (n) => { const d = split(n).dp; return d ? '소수 ' + PLACE[d] + ' 자리' : '자연수'; };

  /** 세로셈에서 아랫줄을 옮겨 적지 않고 더했을 때 나오는 수 (15 × 25 → 75 + 30 = 105) */
  function unshifted(x, y) {
    const ds = String(y).split('').map(Number);
    if (ds.filter((d) => d > 0).length < 2) return null;     // 아랫수가 한 자리면 이 실수는 없음
    return ds.reduce((s, d) => s + x * d, 0);
  }

  /** 어림하기: 소수 자리가 더 많은 수를 앞뒤 '쉬운 수'로 바꿔 범위를 알려 줌 */
  function estimate(q) {
    const pickA = split(q.a).dp >= split(q.b).dp, x = pickA ? q.a : q.b, y = pickA ? q.b : q.a;
    let lo, hi;
    if (x >= 1) { lo = Math.floor(x); hi = lo + 1; }
    else { const st = Math.pow(10, Math.floor(Math.log10(x))); lo = fix(Math.floor(fix(x / st)) * st); hi = fix(lo + st); }
    const m = (v) => pickA ? num(v) + ' × ' + num(y) : num(y) + ' × ' + num(v);
    return '어림해 볼까? ' + num(lo) + (near(x, lo) ? ' = ' : ' < ') + num(x) + ' < ' + num(hi) + ' 이니까 ' +
      m(lo) + ' = ' + num(fix(lo * y)) + ', ' + m(hi) + ' = ' + num(fix(hi * y)) + '. 그러니까 답은 ' +
      num(fix(lo * y)) + ' 이상 ' + num(fix(hi * y)) + ' 미만이야.';
  }

  /** 소수점 규칙 */
  function rule(q) {
    const A = split(q.a), B = split(q.b), d = A.dp + B.dp;
    return '소수점을 떼고 ' + A.int + ' × ' + B.int + '부터 계산해 봐. ' + num(q.a) + ': ' + dpText(q.a) + ', ' + num(q.b) + ': ' + dpText(q.b) +
      '. 그러니까 답은 소수 ' + PLACE[d] + ' 자리가 되게 소수점을 찍어.';
  }

  /** 틀린 답을 보고 힌트 고르기. 반환: { kind: 실수 이름, text: 힌트 } */
  function diagnose(q, text, generic) {
    const v = parse(text), ans = q.answer, a = q.a, b = q.b, A = split(a), B = split(b), d = A.dp + B.dp;
    if (q.type === 'C' && near(v, ans * 1000)) return { kind: 'unit', text: '숫자는 맞았어! 그런데 답은 kg으로 적어야 해. g으로 계산했니?' };
    if (near(v, a + b)) return { kind: 'add', text: '혹시 더했니? 이 문제는 더하기가 아니라 곱하기야!' };
    if ((b && near(v, a / b)) || (a && near(v, b / a))) return { kind: 'div', text: '혹시 나눴니? 이 문제는 나누기가 아니라 곱하기야!' };
    if (d > 0 && near(v, A.int * B.int)) {
      return { kind: 'nodot', text: '곱셈은 맞았어! 그런데 소수점을 안 찍었네. ' + num(a) + ': ' + dpText(a) + ', ' + num(b) + ': ' + dpText(b) +
        '. 그러니까 답은 소수 ' + PLACE[d] + ' 자리가 되게 소수점을 찍어야 해.' };
    }
    for (let k = -6; k <= 6; k++) {
      if (k && near(v, ans * Math.pow(10, k))) {
        return { kind: 'place', text: '숫자는 맞았어! 소수점 위치만 틀렸어. 답이 ' + (k > 0 ? '너무 커' : '너무 작아') +
          '. 두 수의 소수 자리 수를 더하면 몇 자리인지 다시 세어 봐.' };
      }
    }
    if (ans !== Math.round(ans)) {
      const dp = split(ans).dp;
      for (let p = 0; p < dp; p++) {
        const f = Math.pow(10, p);
        if (near(v, Math.round(ans * f) / f) || near(v, Math.floor(ans * f) / f)) {
          return { kind: 'round', text: '거의 다 왔어! 반올림하거나 끝자리를 버리지 말고 소수 끝까지 적어 봐.' };
        }
      }
    }
    const sh = [unshifted(A.int, B.int), unshifted(B.int, A.int)].filter((x) => x !== null);
    for (const x of sh) {
      for (let k = -8; k <= 8; k++) {
        if (near(v, x * Math.pow(10, k))) return { kind: 'shift', text: '세로셈에서 아랫줄을 한 칸 왼쪽으로 옮겨 적었니? 자리를 맞춰서 다시 더해 봐.' };
      }
    }
    if (ans > 0 && Math.abs(v - ans) / ans < 0.15) return { kind: 'close', text: '어림은 잘했어! 답이 거의 비슷해. 곱셈하는 중간에 실수가 있나 봐. 받아올림을 다시 확인해 봐.' };
    // 어떤 실수인지 모를 때: 1번째 어림하기, 2번째부터 소수점 규칙
    return generic === 0 ? { kind: 'unknown', text: estimate(q) } : { kind: 'unknown', text: rule(q) };
  }

  /** 세로셈 풀이 (3번째로 틀렸을 때 보여 줌).
      반환: { top, bottom, rows: [부분곱...], product, zeros, joined, dp, answer }
      예: 0.15 × 2500 → 15 × 25 = 375, 0 두 개 붙여 37500, 소수 두 자리 → 375 */
  function vertical(q) {
    const A = split(q.a), B = split(q.b);
    const strip = (n) => { let z = 0; while (n > 0 && n % 10 === 0) { n /= 10; z++; } return { n, z }; };
    const sa = strip(A.int), sb = strip(B.int);
    const big = String(sa.n).length >= String(sb.n).length ? sa.n : sb.n, small = big === sa.n ? sb.n : sa.n;
    const rows = String(small).split('').reverse().map((dg, i) => ({ value: big * Number(dg), shift: i }));
    const product = big * small, zeros = sa.z + sb.z;
    return { top: big, bottom: small, rows: rows.length > 1 ? rows : [], product, zeros, joined: product * Math.pow(10, zeros),
      dp: A.dp + B.dp, aInt: A.int, bInt: B.int, answer: q.answer, PLACE };
  }

  return { build, parse, isRight, num, fix, diagnose, vertical, split };
})();
