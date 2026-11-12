/* 효과음: 파일 없이 브라우저가 직접 만들어요 (WebAudio). 기본은 꺼짐이고, 🔔 버튼으로 켜고 꺼요. */
const GGSound = (function () {
  const KEY = 'gramgram_sound_v1';
  let on = false, ctx = null;
  try { on = localStorage.getItem(KEY) === '1'; } catch (e) { /* 무시 */ }

  function ac() {
    if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { ctx = new C(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  /** 음 하나: 높이(Hz), 시작(초), 길이(초), 모양, 크기 */
  function tone(f, t0, dur, type, vol, f2) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0;
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  const SOUNDS = {
    click: () => tone(660, 0, 0.05, 'triangle', 0.06),
    pop:   () => { tone(520, 0, 0.12, 'sine', 0.16, 180); tone(140, 0.05, 0.1, 'triangle', 0.1); },     // 재료가 팬에 톡
    ding:  () => { tone(880, 0, 0.18, 'sine', 0.13); tone(1320, 0.07, 0.25, 'sine', 0.1); },            // 셰프 점수
    good:  () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.14)),     // 높은 점수
    soft:  () => { tone(392, 0, 0.25, 'sine', 0.12); tone(330, 0.18, 0.35, 'sine', 0.1); },              // 아쉬운 점수
    chop:  () => { tone(1400, 0, 0.03, 'square', 0.05, 600); tone(160, 0.01, 0.06, 'triangle', 0.12); },   // 도마 위 칼질
    error: () => { tone(220, 0, 0.12, 'square', 0.06); tone(180, 0.1, 0.16, 'square', 0.06); }
  };
  function play(name) { if (!on) return; try { (SOUNDS[name] || SOUNDS.click)(); } catch (e) { /* 소리가 안 나도 앱은 계속 */ } }

  function sync() {
    document.querySelectorAll('.snd').forEach((b) => {
      b.textContent = on ? '🔔 소리 켬' : '🔕 소리 끔';
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function toggle() {
    on = !on;
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* 무시 */ }
    sync(); if (on) { ac(); SOUNDS.ding(); }
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('snd')) { toggle(); return; }
    if (!b.disabled && !b.classList.contains('k-card')) play('click');          // 재료 카드는 pop 소리를 따로 냄
  });
  document.addEventListener('DOMContentLoaded', sync);
  sync();
  return { play, toggle, isOn: () => on };
})();
