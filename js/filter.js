/* 이름 검사: 부적절한 말은 걸러냅니다. (금지어 목록은 data/rules.js 의 GG_BANNED_WORDS)
   요리 이름, 참가자 이름, 모둠 이름에 모두 씁니다. */
const GGFilter = (function () {
  /** 띄어쓰기, 기호, 숫자를 없애서 "시1발", "시 발" 같은 우회도 잡음 (한글, 자음, 영문만 남김) */
  function normalize(s) {
    return s.toLowerCase().replace(/[^a-zㄱ-ㆎ가-힣]/g, '');
  }

  /** 문제가 없으면 { ok: true }, 있으면 { ok: false, msg }.  label 은 안내 문구에 쓸 이름 종류, max 는 최대 글자 수 */
  function check(name, label, max) {
    label = label || '요리 이름'; max = max || 20;
    const raw = (name || '').trim();
    if (raw.length === 0) return { ok: false, msg: label + '을(를) 적어 주세요.' };
    if (raw.length > max) return { ok: false, msg: label + '은(는) ' + max + '글자까지 쓸 수 있어요.' };
    const norm = normalize(raw);
    if (norm.length === 0) return { ok: false, msg: '글자로 된 ' + label + '을(를) 적어 주세요.' };
    if (GG_BANNED_WORDS.some((w) => norm.includes(normalize(w)))) {
      return { ok: false, msg: '다른 사람이 기분 나쁠 수 있는 말이 들어 있어요. 멋진 ' + label + '으로 다시 지어 볼까요?' };
    }
    return { ok: true };
  }

  return { check };
})();
