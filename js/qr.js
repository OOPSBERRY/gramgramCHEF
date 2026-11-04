/* QR 코드 만들기 (외부 서비스·라이브러리 없이 이 파일만으로 동작).
   글자(주소)를 QR 규격(바이트 모드, 오류 정정 M)으로 바꿔서 SVG 그림으로 돌려줍니다. */
const GGQR = (function () {
  // 버전(1~40)별 오류정정 코드 수와 블록 수 (오류 정정 수준 M). 인덱스 0은 사용 안 함.
  const ECC_PER_BLOCK = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28];
  const NUM_BLOCKS   = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49];
  const FORMAT_M = 0;                                   // 오류 정정 수준 M 의 형식 비트

  function utf8(str) { return Array.from(new TextEncoder().encode(str)); }

  function rawModules(ver) {
    let r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) { const n = Math.floor(ver / 7) + 2; r -= (25 * n - 10) * n - 55; if (ver >= 7) r -= 36; }
    return r;
  }
  const dataCodewords = (ver) => Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ver] * NUM_BLOCKS[ver];

  /* ----- 오류 정정(리드-솔로몬) ----- */
  function gfMul(x, y) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z; }
  function rsDivisor(deg) {
    const res = new Array(deg).fill(0); res[deg - 1] = 1; let root = 1;
    for (let i = 0; i < deg; i++) { for (let j = 0; j < deg; j++) { res[j] = gfMul(res[j], root); if (j + 1 < deg) res[j] ^= res[j + 1]; } root = gfMul(root, 2); }
    return res;
  }
  function rsRemainder(data, div) {
    const res = new Array(div.length).fill(0);
    data.forEach((b) => { const f = b ^ res.shift(); res.push(0); div.forEach((c, i) => { res[i] ^= gfMul(c, f); }); });
    return res;
  }
  function addEccAndInterleave(data, ver) {
    const nb = NUM_BLOCKS[ver], eccLen = ECC_PER_BLOCK[ver], raw = Math.floor(rawModules(ver) / 8);
    const nShort = nb - raw % nb, shortLen = Math.floor(raw / nb), div = rsDivisor(eccLen), blocks = [];
    for (let i = 0, k = 0; i < nb; i++) {
      const dat = data.slice(k, k + shortLen - eccLen + (i < nShort ? 0 : 1)); k += dat.length;
      const ecc = rsRemainder(dat, div); if (i < nShort) dat.push(0); blocks.push(dat.concat(ecc));
    }
    const out = [];
    for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - eccLen || j >= nShort) out.push(b[i]); });
    return out;
  }

  /* ----- 그림 그리기 ----- */
  function alignPositions(ver) {
    if (ver === 1) return [];
    const n = Math.floor(ver / 7) + 2, step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2, size = ver * 4 + 17, r = [6];
    for (let pos = size - 7; r.length < n; pos -= step) r.splice(1, 0, pos);
    return r;
  }

  function build(codewords, ver, mask) {
    const size = ver * 4 + 17;
    const mod = Array.from({ length: size }, () => new Array(size).fill(false));
    const fn = Array.from({ length: size }, () => new Array(size).fill(false));
    const set = (x, y, dark) => { mod[y][x] = dark; fn[y][x] = true; };
    const bit = (v, i) => ((v >>> i) & 1) !== 0;

    for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }                 // 점선
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(([cx, cy]) => {                                     // 모서리 큰 네모
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
      }
    });
    const ap = alignPositions(ver), na = ap.length;
    for (let i = 0; i < na; i++) for (let j = 0; j < na; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ap[i] + dx, ap[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    const drawFormat = (m) => {
      const data = (FORMAT_M << 3) | m; let rem = data;
      for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      const bits = ((data << 10) | rem) ^ 0x5412;
      for (let i = 0; i <= 5; i++) set(8, i, bit(bits, i));
      set(8, 7, bit(bits, 6)); set(8, 8, bit(bits, 7)); set(7, 8, bit(bits, 8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, bit(bits, i));
      for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(bits, i));
      for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(bits, i));
      set(8, size - 8, true);
    };
    drawFormat(0);
    if (ver >= 7) {
      let rem = ver; for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      const bits = (ver << 12) | rem;
      for (let i = 0; i < 18; i++) { const b = bit(bits, i), a = size - 11 + i % 3, c = Math.floor(i / 3); set(a, c, b); set(c, a, b); }
    }
    // 데이터 배치 (지그재그)
    let k = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
        const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!fn[y][x] && k < codewords.length * 8) { mod[y][x] = bit(codewords[k >>> 3], 7 - (k & 7)); k++; }
      }
    }
    const applyMask = (m) => {
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const inv = [(x + y) % 2 === 0, y % 2 === 0, x % 3 === 0, (x + y) % 3 === 0, (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
          x * y % 2 + x * y % 3 === 0, (x * y % 2 + x * y % 3) % 2 === 0, ((x + y) % 2 + x * y % 3) % 2 === 0][m];
        if (inv && !fn[y][x]) mod[y][x] = !mod[y][x];
      }
    };
    return { size, mod, applyMask, drawFormat };
  }

  /** 감점(규격의 4가지 규칙)을 계산해서, 읽기 쉬운 마스크를 고름 */
  function penalty(mod, size) {
    let p = 0;
    const lines = [];
    for (let i = 0; i < size; i++) { lines.push(mod[i].slice()); lines.push(mod.map((r) => r[i])); }
    lines.forEach((ln) => {
      let run = 1;
      for (let i = 1; i <= size; i++) { if (i < size && ln[i] === ln[i - 1]) run++; else { if (run >= 5) p += 3 + run - 5; run = 1; } }
      const s = ln.map((v) => (v ? 1 : 0)).join('');
      for (let i = 0; i + 11 <= size; i++) { const t = s.substr(i, 11); if (t === '10111010000' || t === '00001011101') p += 40; }
    });
    for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) if (mod[y][x] === mod[y][x + 1] && mod[y][x] === mod[y + 1][x] && mod[y][x] === mod[y + 1][x + 1]) p += 3;
    let dark = 0; mod.forEach((r) => r.forEach((v) => { if (v) dark++; }));
    p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
    return p;
  }

  /** 글자를 QR 모양(true=검정 칸)으로 바꿈. mask(0~7)를 주면 그 마스크로 고정 (시험용) */
  function encode(text, forceMask) {
    const bytes = utf8(text);
    let ver = 1;
    for (; ver <= 40; ver++) { const cc = ver <= 9 ? 8 : 16; if (4 + cc + bytes.length * 8 <= dataCodewords(ver) * 8) break; }
    if (ver > 40) throw new Error('주소가 너무 길어요');
    const bb = [];
    const push = (v, n) => { for (let i = n - 1; i >= 0; i--) bb.push((v >>> i) & 1); };
    push(4, 4); push(bytes.length, ver <= 9 ? 8 : 16); bytes.forEach((b) => push(b, 8));
    const cap = dataCodewords(ver) * 8;
    push(0, Math.min(4, cap - bb.length)); while (bb.length % 8) bb.push(0);
    for (let pad = 0xEC; bb.length < cap; pad ^= 0xEC ^ 0x11) push(pad, 8);
    const data = []; for (let i = 0; i < bb.length; i += 8) { let v = 0; for (let j = 0; j < 8; j++) v = (v << 1) | bb[i + j]; data.push(v); }
    const all = addEccAndInterleave(data, ver);

    let best = null, bestScore = Infinity;
    const masks = forceMask === undefined ? [0, 1, 2, 3, 4, 5, 6, 7] : [forceMask];
    masks.forEach((m) => {
      const q = build(all, ver, m); q.applyMask(m); q.drawFormat(m);
      const sc = penalty(q.mod, q.size);
      if (sc < bestScore) { bestScore = sc; best = q; }
    });
    return { size: best.size, modules: best.mod, version: ver };
  }

  /** SVG 그림 글자로 (둘레 여백 4칸 포함) */
  function svg(text, px) {
    const q = encode(text), n = q.size + 8;
    let d = '';
    for (let y = 0; y < q.size; y++) for (let x = 0; x < q.size; x++) if (q.modules[y][x]) d += 'M' + (x + 4) + ' ' + (y + 4) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" width="' + (px || 280) + '" height="' + (px || 280) + '" shape-rendering="crispEdges" role="img" aria-label="접속 QR 코드">' +
      '<rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }

  return { encode, svg };
})();
