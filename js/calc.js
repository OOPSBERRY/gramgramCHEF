/* 계산 도우미: 단위 변환, 가격, 무게 (화면과 분리된 순수 계산) */
const GGCalc = (function () {
  const BIG = { g: 'kg', mL: 'L' };

  /** 재료의 기본 단위가 g이면 ['g','kg'], mL이면 ['mL','L'] */
  function unitPair(base) { return [base, BIG[base]]; }

  /** 보여줄 단위(g/kg/mL/L)가 기본 단위의 몇 배인가 */
  function factor(unit) { return (unit === 'kg' || unit === 'L') ? 1000 : 1; }

  function round(n, d) { const p = Math.pow(10, d); return Math.round(n * p) / p; }

  /** 기본 단위 양 → 보여줄 단위 양 (예: 1500 g → 1.5 kg) */
  function toDisplay(amount, unit) { return round(amount / factor(unit), 3); }

  /** 보여줄 단위 양 → 기본 단위 양 (예: 1.5 kg → 1500 g) */
  function fromDisplay(value, unit) { return round(value * factor(unit), 3); }

  /** 재료 하나의 가격(원). 100g(또는 100mL)당 가격 × 양 ÷ 100, 원 단위로 반올림 */
  function cost(ing, amount) { return Math.round(amount / 100 * ing.price); }

  /** 재료 하나의 무게(g). mL 재료는 밀도를 곱해서 g으로 바꿈 */
  function grams(ing, amount) { return ing.unit === 'g' ? amount : amount * (ing.density || 1); }

  function totalCost(items) { return items.reduce((s, it) => s + cost(it.ing, it.amount), 0); }
  function totalGrams(items) { return items.reduce((s, it) => s + grams(it.ing, it.amount), 0); }

  function won(n) { return Math.round(n).toLocaleString('ko-KR') + '원'; }

  /** 양을 읽기 좋게 (예: 1500g → "1.5kg", 250mL → "250mL") */
  function amountText(amount, base) {
    if (amount >= 1000) return round(amount / 1000, 2) + BIG[base];
    return round(amount, amount >= 100 ? 0 : 1) + base;
  }

  return { unitPair, factor, round, toDisplay, fromDisplay, cost, grams, totalCost, totalGrams, won, amountText };
})();
