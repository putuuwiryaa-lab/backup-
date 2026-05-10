const TBL_I: Record<string, number> = { "0": 5, "1": 6, "2": 7, "3": 8, "4": 9, "5": 0, "6": 1, "7": 2, "8": 3, "9": 4 };
const TBL_L: Record<string, number> = { "0": 1, "1": 0, "2": 5, "5": 2, "3": 8, "8": 3, "4": 7, "7": 4, "6": 9, "9": 6 };
const TBL_B: Record<string, number> = { "0": 8, "8": 0, "1": 7, "7": 1, "2": 6, "6": 2, "3": 9, "9": 3, "4": 5, "5": 4 };
const TBL_T: Record<string, number> = { "0": 7, "1": 4, "2": 9, "3": 6, "4": 1, "5": 8, "6": 3, "7": 0, "8": 5, "9": 2 };
const AI_I = TBL_I, AI_L = TBL_L, AI_B = TBL_B, AI_T = TBL_T;
const AI_P: Record<string, number> = { "0": 2, "1": 2, "2": 3, "3": 5, "4": 5, "5": 7, "6": 7, "7": 2, "8": 2, "9": 2 };

function _0xc3c54e(x: number) { return ((x % 10) + 10) % 10; }
function _0xJ2d(a: string | number, b: string | number) {
  const s = parseInt(a as string) + parseInt(b as string);
  return s >= 10 ? s - 9 : s;
}

const _0x9a025f = [
  { n: "R1 Delta Square", f: (c: string, p: string, p2: string) => { const X = Math.abs(+c[1] - +c[3]); return Array.from(new Set([X, AI_B[X], AI_T[X], AI_I[X]])); }, dg: 4 },
  { n: "R2 Mirror Cross", f: (c: string, p: string, p2: string) => { const X = (+c[0] + (+c[2])) % 10; return Array.from(new Set([X, AI_I[X], _0xc3c54e(X + 1), AI_I[_0xc3c54e(X + 1)], _0xc3c54e(X + 2)])); }, dg: 5 },
  { n: "R3 Biji Resonansi", f: (c: string, p: string, p2: string) => { const X = (+c[0] + (+c[1]) + (+c[2]) + (+c[3])) % 10; return Array.from(new Set([X, AI_L[X], AI_T[X], _0xc3c54e(X + 1), _0xc3c54e(X - 1)])); }, dg: 5 },
  { n: "R4 Diagonal Flow", f: (c: string, p: string, p2: string) => { if (!p) return null; const X = (+p[1] + (+c[3])) % 10; return Array.from(new Set([X, _0xc3c54e(X + 1), _0xc3c54e(X + 2), _0xc3c54e(X + 3), AI_I[X]])); }, dg: 5 },
  { n: "R5 Triple Morph", f: (c: string, p: string, p2: string) => { const X = +c[3]; return Array.from(new Set([X, AI_I[X], AI_L[X], AI_B[X], AI_T[X], AI_T[AI_I[X]]])); }, dg: 6 },
  { n: "R6 V-Shift", f: (c: string, p: string, p2: string) => { const X = Math.abs(+c[1] - +c[2]); return Array.from(new Set([X, _0xc3c54e(X + 2), _0xc3c54e(X - 2), AI_I[X]])); }, dg: 4 },
  { n: "R7 Prime Pulse", f: (c: string, p: string, p2: string) => { const X = (+c[0] + (+c[3])) % 10; return Array.from(new Set([X, AI_P[X], AI_L[X], AI_T[X]])); }, dg: 4 },
  { n: "R8 Shadow Digit", f: (c: string, p: string, p2: string) => { const X = (+c[1] + (+c[3])) % 10; const sh = _0xc3c54e(10 - X); return Array.from(new Set([X, sh, AI_I[X], AI_I[sh]])); }, dg: 4 },
  { n: "R9 Head Twin Flow", f: (c: string, p: string, p2: string) => { if (!p) return null; const X = (+p[2] + (+c[2])) % 10; return Array.from(new Set([X, _0xc3c54e(X + 1), AI_B[X], AI_I[X]])); }, dg: 4 },
  { n: "R10 Quantum Leap", f: (c: string, p: string, p2: string) => { if (!p2) return null; const X = Math.abs(+c[3] - +p2[3]); return Array.from(new Set([X, AI_B[X], AI_I[X], AI_T[X], _0xc3c54e(X + 1)])); }, dg: 5 },
  { n: "R11 Alpha Core", f: (c: string, p: string, p2: string) => { const X = (+c[0] + (+c[1])) % 10; return Array.from(new Set([X, AI_L[X], AI_B[X], AI_I[X]])); }, dg: 4 },
  { n: "R12 Delta Strike", f: (c: string, p: string, p2: string) => { const X = Math.abs(+c[0] - +c[2]); return Array.from(new Set([X, AI_T[X], AI_B[X], AI_I[X]])); }, dg: 4 },
  { n: "R13 Tail Run", f: (c: string, p: string, p2: string) => { const X = (+c[2] + (+c[3])) % 10; return Array.from(new Set([X, _0xc3c54e(X + 1), _0xc3c54e(X + 2), _0xc3c54e(X + 3), AI_I[X]])); }, dg: 5 },
  { n: "R14 As Kop Gap", f: (c: string, p: string, p2: string) => { const X = Math.abs(+c[0] - +c[1]); return Array.from(new Set([X, AI_L[X], AI_I[X], AI_T[X]])); }, dg: 4 },
  { n: "R15 Kop Twin Flow", f: (c: string, p: string, p2: string) => { if (!p) return null; const X = (+p[1] + (+c[1])) % 10; return Array.from(new Set([X, AI_I[X], AI_B[X], _0xc3c54e(X + 1)])); }, dg: 4 },
  { n: "R16 Head Shift", f: (c: string, p: string, p2: string) => { const X = +c[2]; return Array.from(new Set([X, _0xc3c54e(X + 1), AI_B[X], AI_I[X]])); }, dg: 4 },
  { n: "R17 Twin Alpha", f: (c: string, p: string, p2: string) => { if (!p) return null; const X = (+p[0] + (+c[0])) % 10; return Array.from(new Set([X, AI_L[X], AI_T[X], AI_I[X]])); }, dg: 4 },
  { n: "R18 Omega Gap", f: (c: string, p: string, p2: string) => { if (!p) return null; const X = Math.abs(+p[3] - +c[3]); return Array.from(new Set([X, _0xc3c54e(X + 2), AI_B[X], AI_I[X]])); }, dg: 4 },
  { n: "R19 Mid Flow", f: (c: string, p: string, p2: string) => { const X = (+c[1] + (+c[2])) % 10; return Array.from(new Set([X, AI_T[X], AI_L[X], AI_I[X]])); }, dg: 4 },
  { n: "R20 Front Trinity", f: (c: string, p: string, p2: string) => { const X = (+c[0] + (+c[1]) + (+c[2])) % 10; return Array.from(new Set([X, AI_B[X], AI_I[X], _0xc3c54e(X + 1)])); }, dg: 4 },
  { n: "R21 Alpha Lag Gap", f: (c: string, p: string, p2: string) => { if (!p2) return null; const X = Math.abs(+p2[0] - +c[0]); return Array.from(new Set([X, AI_L[X], AI_B[X], _0xc3c54e(X + 1)])); }, dg: 4 },
  { n: "R22 Lag Tail Multiply", f: (c: string, p: string, p2: string) => { if (!p2) return null; const X = (+p2[3] * (+c[3])) % 10; return Array.from(new Set([X, AI_L[X], AI_B[X], AI_I[X]])); }, dg: 4 },
  { n: "R23 Cross Multiply Flow", f: (c: string, p: string, p2: string) => { if (!p) return null; const X = ((+p[0]) * (+c[2])) % 10; return Array.from(new Set([X, AI_T[X], AI_L[X], _0xc3c54e(X + 3)])); }, dg: 4 },
  { n: "R24 Front Multiply", f: (c: string, p: string, p2: string) => { const X = ((+c[0]) * (+c[1]) * (+c[2])) % 10; return Array.from(new Set([X, AI_T[X], AI_I[X], _0xc3c54e(X + 1)])); }, dg: 4 },
  { n: "R25 Lag 2 Resonance", f: (c: string, p: string, p2: string) => { if (!p2) return null; const X = (+p2[0] + (+p2[1]) + (+p2[2]) + (+p2[3])) % 10; return Array.from(new Set([X, AI_T[X], AI_I[X], AI_L[X]])); }, dg: 4 },
  {
    n: "R26 master moegywara666",
    f: (c: string, p: string, p2: string) => {
      const X = +c[2];
      const IDX = AI_I[X];
      return Array.from(new Set([
        X,
        _0xc3c54e(X - 1),
        IDX,
        _0xc3c54e(IDX - 1)
      ]));
    },
    dg: 4
  },
  {
  n: "R27 master moegywara666",
  f: (c: string, p: string, p2: string) => {
    const A = +c[0];
    const K = +c[1];
    return Array.from(new Set([
      _0xJ2d(A, K),
      _0xc3c54e(A + 1),
      _0xc3c54e(A + 2),
      AI_I[A]
    ]));
  },
  dg: 4
},
  {
  n: "R28 master moegywara666",
  f: (c: string, p: string, p2: string) => {
    const X = _0xJ2d(c[2], c[3]);
    const MB = AI_B[X];
    return Array.from(new Set([
      X,
      MB,
      _0xc3c54e(MB + 2)
    ]));
  },
  dg: 3
},
{
  n: "R29 master moegywara666",
  f: (c: string, p: string, p2: string) => {
    const X = +c[3];
    return Array.from(new Set([
      X,
      _0xc3c54e(X - 1),
      _0xc3c54e(X - 2),
      _0xc3c54e(X + 3),
      _0xc3c54e(X + 4)
    ]));
  },
  dg: 5
},
{
    n: "R30 Cosmic Chain",
    f: (c: string, p: string, p2: string) => {
      const X = (+c[0] + +c[2]) % 10;
      const MB = AI_B[X];
      const IDX = AI_I[MB];
      const ML = AI_L[IDX];
      return Array.from(new Set([X, MB, IDX, ML]));
    },
    dg: 4
  },
];
];

const _0xe57f0c: Record<number, number> = { 4: 11, 5: 12, 6: 13 };

const SHIO_TBL: Record<number, number> = (function () {
  const t: Record<number, number> = {};
  const data = [
    [1, [1, 13, 25, 37, 49, 61, 73, 85, 97]],
    [2, [2, 14, 26, 38, 50, 62, 74, 86, 98]],
    [3, [3, 15, 27, 39, 51, 63, 75, 87, 99]],
    [4, [4, 16, 28, 40, 52, 64, 76, 88, 0]],
    [5, [5, 17, 29, 41, 53, 65, 77, 89]],
    [6, [6, 18, 30, 42, 54, 66, 78, 90]],
    [7, [7, 19, 31, 43, 55, 67, 79, 91]],
    [8, [8, 20, 32, 44, 56, 68, 80, 92]],
    [9, [9, 21, 33, 45, 57, 69, 81, 93]],
    [10, [10, 22, 34, 46, 58, 70, 82, 94]],
    [11, [11, 23, 35, 47, 59, 71, 83, 95]],
    [12, [12, 24, 36, 48, 60, 72, 84, 96]],
  ];
  data.forEach((d) => { (d[1] as number[]).forEach((n: number) => { t[n] = d[0] as number; }); });
  return t;
})();

function _0x2d4get(r: string) {
  const n = parseInt(r[2]) * 10 + parseInt(r[3]);
  return SHIO_TBL[n] || SHIO_TBL[n % 100] || 1;
}

function _0x3ca571(a: string, b: string) {
  const p = { as: +a[0], kop: +a[1], kpl: +a[2], ekr: +a[3] };
  const c2 = { as: +b[0], kop: +b[1], kpl: +b[2], ekr: +b[3] };
  return {
    a: (c2.kpl + c2.ekr) % 10, b: TBL_I[(c2.as + c2.ekr) % 10], c: TBL_L[(c2.kop + c2.kpl) % 10],
    d: Math.abs(c2.as - c2.ekr), e: TBL_B[(p.ekr + c2.ekr) % 10], f: TBL_I[(p.as + c2.as) % 10],
    g: (c2.as + c2.kop + c2.kpl + c2.ekr) % 10, h: TBL_L[(c2.ekr + 1) % 10], i: TBL_I[Math.abs(c2.kpl - c2.ekr)],
    j: (c2.as + c2.kop) % 10, k: TBL_I[Math.abs(c2.kop - c2.kpl)], l: (p.kpl + c2.kpl) % 10,
    m: TBL_T[(c2.kpl + c2.ekr) % 10], n: TBL_L[(p.kop + c2.kop) % 10], o: TBL_I[(c2.as + c2.kpl) % 10],
    p: TBL_L[Math.abs(c2.as - c2.kpl)], q: TBL_B[Math.abs(c2.kop - c2.ekr)], r: (c2.kop + c2.kpl + c2.ekr) % 10,
    s: TBL_I[(c2.kpl + 1) % 10], t: TBL_T[c2.as], u: (p.as + c2.as) % 10, v: Math.abs(p.kop - c2.kop),
    w: (p.kpl + c2.ekr) % 10, x: TBL_L[(p.as + c2.kop) % 10], y: TBL_B[Math.abs(p.ekr - c2.as)],
    z: (p.as + p.kop + c2.kpl + c2.ekr) % 10, aa: TBL_T[(p.ekr + c2.ekr) % 10], bb: Math.abs(c2.as - c2.kpl),
    cc: TBL_I[(c2.kop + c2.ekr) % 10], dd: TBL_L[(c2.as + c2.kop + c2.kpl + c2.ekr) % 10],
    ee: TBL_B[TBL_T[(c2.as + p.ekr) % 10]], ff: (c2.kop * c2.ekr) % 10, gg: TBL_L[(c2.as + c2.kop + c2.kpl) % 10],
    hh: (TBL_I[(p.as + c2.as) % 10] + TBL_B[(p.ekr + c2.ekr) % 10]) % 10, ii: Math.abs(TBL_T[c2.kpl] - TBL_T[c2.ekr]),
    jj: (TBL_L[c2.kop] + TBL_B[c2.kpl]) % 10, kk: TBL_I[(p.as + c2.ekr) % 10], ll: TBL_T[(p.kpl + p.ekr + c2.kpl + c2.ekr) % 10],
    mm: Math.abs((c2.as + c2.kop) - (c2.kpl + c2.ekr)) % 10, nn: TBL_T[(p.kop + c2.kpl) % 10], oo: TBL_I[(p.ekr * c2.ekr) % 10],
    pp: TBL_I[Math.abs(p.kop - c2.kpl)], qq: TBL_L[(c2.kop + c2.kpl + c2.ekr) % 10], rr: (c2.as * p.ekr) % 10,
    ss: TBL_B[(p.kop + p.kpl + c2.kop + c2.kpl) % 10], tt: Math.abs(TBL_T[c2.as] - TBL_T[c2.ekr]), uu: ((p.as + c2.ekr) * (p.ekr + c2.as)) % 10,
    vv: TBL_I[Math.abs(c2.kop - p.kpl)], ww: (((p.as + p.kop + p.kpl + p.ekr) % 10) * c2.ekr) % 10, xx: TBL_T[(c2.as + c2.kop + c2.kpl) % 10],
// R51 Rumus Master Moegywara666
yy: _0xJ2d(_0xJ2d(c2.kpl, c2.ekr), 6),
  };
}

function _0xRumusShio(a: string, b: string) {
  const p = { A: +a[0], B: +a[1], C: +a[2], D: +a[3] };
  const c = { A: +b[0], B: +b[1], C: +b[2], D: +b[3] };
  const m = (x: number) => { const v = Math.abs(x) % 12; return v === 0 ? 12 : v; };
  return {
    k1: m(c.A + c.B + c.C + c.D), k2: m(p.D + c.D), k3: m(c.C * c.D), k4: m(c.A * c.D), k5: m(c.B + c.C),
    k6: m(p.A + c.A), k7: m(p.B + c.B), k8: m(p.C + c.C), k9: m(c.A - c.D), k10: m(c.B - c.C), k11: m(p.D * c.A),
    k12: m(p.C * c.B), k13: m(p.B * c.C), k14: m(p.A * c.D), k15: m(c.A + c.B), k16: m(c.C + c.D),
    k17: m(p.A + p.B + c.C + c.D), k18: m(p.C + p.D + c.A + c.B), k19: m(c.A * c.B), k20: m(p.A * p.B),
    k21: m(c.A + c.C), k22: m(c.B + c.D), k23: m(p.A + c.C), k24: m(p.B + c.D), k25: m(p.A - c.A),
    k26: m(p.B - c.B), k27: m(p.C - c.C), k28: m(p.D - c.D), k29: m(c.A + p.D), k30: m(c.D + p.A),
    k31: m(c.A * p.A), k32: m(c.B * p.B), k33: m(c.C * p.C), k34: m(c.D * p.D), k35: m((c.A + c.B) * (c.C + c.D)),
    k36: m((p.A + p.B) * (p.C + p.D)), k37: m(c.A + c.B - c.C), k38: m(c.B + c.C - c.D), k39: m(p.A + p.B - c.D),
    k40: m(p.C + p.D - c.A), k41: m(c.A + c.D + p.A + p.D), k42: m(c.B + c.C + p.B + p.C), k43: m((c.A * c.C) + c.D),
    k44: m((c.B * c.D) + c.A), k45: m((p.A * p.C) + p.D), k46: m((p.B * p.D) + p.A), k47: m(c.A + p.B + c.C + p.D),
    k48: m(c.B + p.C + c.D + p.A), k49: m(c.A * c.B * c.C), k50: m(c.B * c.C * c.D),
  };
}

function _0xEngineAI(D: string[], param: number = 6) {
  const U = D.slice(-17);
  const vote: Record<number, number> = {};
  for (let d = 0; d <= 9; d++) vote[d] = 0;
  let elit = 0;
  for (let r = 0; r < _0x9a025f.length; r++) {
    const rm = _0x9a025f[r];
    let hits = 0;
    for (let i = 0; i < 14; i++) {
        const prev2 = U[i], prev = U[i + 1], curr = U[i + 2], tgt = U[i + 3];
        const ai = rm.f(curr, prev, prev2);
        if (ai === null) continue;
        if (ai.includes(parseInt(tgt[2])) || ai.includes(parseInt(tgt[3]))) hits++;
    }
    const thr = _0xe57f0c[rm.dg] || 10;
    if (hits >= thr) {
        const fp = rm.f(D[D.length - 1], D[D.length - 2], D[D.length - 3]);
        if (fp !== null) { elit++; for (let j = 0; j < fp.length; j++) vote[fp[j]]++; }
    }
  }
  if (elit === 0) {
    for (let r = 0; r < _0x9a025f.length; r++) {
        const fp = _0x9a025f[r].f(D[D.length - 1], D[D.length - 2], D[D.length - 3]);
        if (fp !== null) for (let j = 0; j < fp.length; j++) vote[fp[j] as number]++;
    }
  }
  const gap: Record<number, number> = {};
  for (let d = 0; d <= 9; d++) gap[d] = U.length;
  for (let j = U.length - 1; j >= 0; j--) {
      const gk = parseInt(U[j][2]), ge = parseInt(U[j][3]);
      if (gap[gk] === U.length) gap[gk] = U.length - 1 - j;
      if (gap[ge] === U.length) gap[ge] = U.length - 1 - j;
  }
  const sorted = Object.keys(vote).map(k => ({ d: parseInt(k), v: vote[parseInt(k)], g: gap[parseInt(k)] }));
  sorted.sort((a, b) => { if (b.v !== a.v) return b.v - a.v; return b.g - a.g; });
  return sorted.slice(0, param).map(x => x.d).sort((a, b) => a - b);
}

function _0xEngineMatiPos(D: string[], posIdx: number, param: number = 1) {
  const U = D.slice(-17);
  const SA: Record<string, number> = {};
  const MK = Object.keys(_0x3ca571('0000', '0000'));
  MK.forEach((k) => { SA[k] = 0; });

  for (let i = 0; i < 14; i++) {
    const pr: any = _0x3ca571(U[i], U[i + 1]), tg = U[i + 2];
    const val = parseInt(tg[posIdx]);
    MK.forEach((k) => { if (pr[k] !== val) SA[k] += 1; });
  }

  const fq: Record<string, number> = {};
  for (let d = 0; d <= 9; d++) fq[String(d)] = 0;
  U.forEach((r) => { fq[r[posIdx]]++; });

  const rc: Record<string, number> = {};
  for (let d = 0; d <= 9; d++) rc[String(d)] = 99;
  for (let j = U.length - 1; j >= 0; j--) {
    const dg = U[j][posIdx];
    if (rc[dg] === 99) rc[dg] = (U.length - 1 - j);
  }

  let el = MK.filter((k) => SA[k] >= 14);
  if (el.length === 0) {
    const mx = Math.max(...MK.map((k) => SA[k]));
    el = MK.filter((k) => SA[k] === mx);
  }

  const FP: any = _0x3ca571(D[D.length - 2], D[D.length - 1]);
  const ct: Record<string, number> = {};
  el.forEach((k) => {
    const v = String(FP[k]);
    ct[v] = (ct[v] || 0) + 1;
  });

  const sr = Object.keys(ct).sort((a, b) => {
    if (ct[b] !== ct[a]) return ct[b] - ct[a];
    const ga = (rc[a] || 99) === 99 ? 1 : 0, gb = (rc[b] || 99) === 99 ? 1 : 0;
    if (ga !== gb) return ga - gb;
    if ((fq[b] || 0) !== (fq[a] || 0)) return (fq[b] || 0) - (fq[a] || 0);
    return (rc[a] || 99) - (rc[b] || 99);
  });
  
  let hasil: string[] = [];
  for (let fi = 0; fi < sr.length && hasil.length < param; fi++) {
    hasil.push(sr[fi]);
  }
  if (hasil.length < param) {
    const fb = Object.keys(fq).sort((a, b) => fq[b] - fq[a]);
    for (let fi = 0; fi < fb.length && hasil.length < param; fi++) {
      if (!hasil.includes(fb[fi])) hasil.push(fb[fi]);
    }
  }
  if (hasil.length === 0) hasil = ['0'];
  return hasil;
}

function _0xEngineJumlahMati(D: string[], param: number = 1) {
  const U = D.slice(-17);
  const SA: Record<string, number> = {};
  const MK = Object.keys(_0x3ca571('0000', '0000'));
  MK.forEach((k) => { SA[k] = 0; });

  for (let i = 0; i < 14; i++) {
    const pr: any = _0x3ca571(U[i], U[i + 1]), tg = U[i + 2];
    const j2d = _0xJ2d(tg[2], tg[3]);
    MK.forEach((k) => { if (pr[k] !== j2d) SA[k] += 1; });
  }

  const fq: Record<string, number> = {};
  for (let d = 0; d <= 9; d++) fq[String(d)] = 0;
  U.forEach((r) => { const j = _0xJ2d(r[2], r[3]); fq[String(j)]++; });

  const rc: Record<string, number> = {};
  for (let d = 0; d <= 9; d++) rc[String(d)] = 99;
  for (let j = U.length - 1; j >= 0; j--) {
    const jd = String(_0xJ2d(U[j][2], U[j][3]));
    if (rc[jd] === 99) rc[jd] = (U.length - 1 - j);
  }

  let el = MK.filter((k) => SA[k] >= 14);
  if (el.length === 0) {
    const mx = Math.max(...MK.map((k) => SA[k]));
    el = MK.filter((k) => SA[k] === mx);
  }

  const FP: any = _0x3ca571(D[D.length - 2], D[D.length - 1]);
  const ct: Record<string, number> = {};
  el.forEach((k) => {
    const v = String(FP[k]);
    ct[v] = (ct[v] || 0) + 1;
  });

  const sr = Object.keys(ct).sort((a, b) => {
    if (ct[b] !== ct[a]) return ct[b] - ct[a];
    const ga = (rc[a] || 99) === 99 ? 1 : 0, gb = (rc[b] || 99) === 99 ? 1 : 0;
    if (ga !== gb) return ga - gb;
    if ((fq[b] || 0) !== (fq[a] || 0)) return (fq[b] || 0) - (fq[a] || 0);
    return (rc[a] || 99) - (rc[b] || 99);
  });

  let hasil: string[] = [];
  for (let fi = 0; fi < sr.length && hasil.length < param; fi++) {
    if (sr[fi] !== '0') hasil.push(sr[fi]);
  }
  if (hasil.length < param) {
    const fb = Object.keys(fq).filter((x) => x !== '0').sort((a, b) => fq[b] - fq[a]);
    for (let fi = 0; fi < fb.length && hasil.length < param; fi++) {
      if (!hasil.includes(fb[fi])) hasil.push(fb[fi]);
    }
  }
  if (hasil.length === 0) hasil = ['1'];
  return hasil;
}

function _0xEngineShioMati(D: string[], param: number = 1) {
  const U = D.slice(-17);
  const SA: Record<string, number> = {};
  const MK = Object.keys(_0xRumusShio('0000', '0000'));
  MK.forEach((k) => { SA[k] = 0; });

  for (let i = 0; i < 14; i++) {
    const pr: any = _0xRumusShio(U[i], U[i + 1]), sh = _0x2d4get(U[i + 2]);
    MK.forEach((k) => { if (pr[k] !== sh) SA[k] += 1; });
  }

  const fq: Record<string, number> = {};
  for (let s = 1; s <= 12; s++) fq[s] = 0;
  U.forEach((r) => { const s = _0x2d4get(r); fq[s]++; });

  const rc: Record<string, number> = {};
  for (let s = 1; s <= 12; s++) rc[s] = 99;
  for (let j = U.length - 1; j >= 0; j--) {
    const sj = _0x2d4get(U[j]);
    if (rc[sj] === 99) rc[sj] = (U.length - 1 - j);
  }

  let el = MK.filter((k) => SA[k] >= 14);
  if (el.length === 0) {
    const mx = Math.max(...MK.map((k) => SA[k]));
    el = MK.filter((k) => SA[k] === mx);
  }

  const FP: any = _0xRumusShio(D[D.length - 2], D[D.length - 1]);
  const ct: Record<string, number> = {};
  el.forEach((k) => {
    const v = FP[k];
    ct[v] = (ct[v] || 0) + 1;
  });

  const sr = Object.keys(ct).map(Number).sort((a, b) => {
    if (ct[b] !== ct[a]) return ct[b] - ct[a];
    const ga = (rc[a] || 99) === 99 ? 1 : 0, gb = (rc[b] || 99) === 99 ? 1 : 0;
    if (ga !== gb) return ga - gb;
    if ((fq[b] || 0) !== (fq[a] || 0)) return (fq[b] || 0) - (fq[a] || 0);
    return (rc[a] || 99) - (rc[b] || 99);
  });

  return sr.slice(0, param);
}

export function runAnalysis(type: string, payload: string[], param: number) {
  const D = payload;
  const U = D.slice(-17);

  if (type === 'rekap') {
    const isTop = param === 2;

    const CT = isTop ? _0xEngineAI(D, 4) : _0xEngineAI(D, 6);
    const LK = isTop ? _0xEngineMatiPos(D, 2, 3).map(Number) : _0xEngineMatiPos(D, 2, 1).map(Number);
    const LE = isTop ? _0xEngineMatiPos(D, 3, 3).map(Number) : _0xEngineMatiPos(D, 3, 1).map(Number);
    const LJ = isTop ? _0xEngineJumlahMati(D, 2).map(Number) : _0xEngineJumlahMati(D, 1).map(Number);
    const LS = isTop ? _0xEngineShioMati(D, 2).map(Number) : _0xEngineShioMati(D, 1).map(Number);
    
    const lines = [];
    for (let k = 0; k <= 9; k++) {
      for (let e = 0; e <= 9; e++) {
        if (LK.includes(k) || LE.includes(e) || LJ.includes(_0xJ2d(k, e))) continue;
        if (LS.includes(_0x2d4get(`00${k}${e}`))) continue;
        if (CT.indexOf(k) === -1 && CT.indexOf(e) === -1) continue;
        lines.push(`${k}${e}`);
      }
    }
    
    return {
      success: true,
      data: {
        ai: CT,
        offKepala: LK,
        offEkor: LE,
        offJumlah: LJ,
        offShio: LS,
        lines: lines
      }
    };
  }

  if (type === 'ai') {
    const sr = [];
    let elitCount = 0;
    const vote: Record<number, number> = {};
    for (let d = 0; d <= 9; d++) vote[d] = 0;

    for (let r = 0; r < _0x9a025f.length; r++) {
      const rm = _0x9a025f[r];
      let hits = 0, valid = 0;
      for (let i = 0; i < 14; i++) {
        const prev2 = U[i], prev = U[i + 1], curr = U[i + 2], tgt = U[i + 3];
        const ai = rm.f(curr, prev, prev2);
        if (ai === null) continue;
        valid++;
        if (ai.includes(parseInt(tgt[2])) || ai.includes(parseInt(tgt[3]))) hits++;
      }
      const thr = _0xe57f0c[rm.dg] || 10;
      const lolos = hits >= thr;
      sr.push({ name: rm.n, dg: rm.dg, hits, valid, thresh: thr, lolos });

      if (lolos) {
        const fp = rm.f(D[D.length - 1], D[D.length - 2], D[D.length - 3]);
        if (fp !== null) {
          elitCount++;
          for (let j = 0; j < fp.length; j++) vote[fp[j]]++;
        }
      }
    }

    let fallback = false;
    if (elitCount === 0) {
      fallback = true;
      for (let r = 0; r < _0x9a025f.length; r++) {
        const fp = _0x9a025f[r].f(D[D.length - 1], D[D.length - 2], D[D.length - 3]);
        if (fp !== null) {
          elitCount++;
          for (let j = 0; j < fp.length; j++) vote[fp[j] as number]++;
        }
      }
    }

    const gap: Record<number, number> = {};
    for (let d = 0; d <= 9; d++) gap[d] = U.length;
    for (let j = U.length - 1; j >= 0; j--) {
      const gk = parseInt(U[j][2]), ge = parseInt(U[j][3]);
      if (gap[gk] === U.length) gap[gk] = U.length - 1 - j;
      if (gap[ge] === U.length) gap[ge] = U.length - 1 - j;
    }
    
    const sorted = Object.keys(vote).map(k => ({ d: parseInt(k), v: vote[parseInt(k)], g: gap[parseInt(k)] }));
    sorted.sort((a, b) => { if (b.v !== a.v) return b.v - a.v; return b.g - a.g; });
    const aiResult = _0xEngineAI(D, param);

    return {
      success: true,
      data: {
        stats: sr.filter(s => s.lolos),
        elitCount,
        fallback,
        result: aiResult
      }
    };
  }

  if (type === 'mati') {
    const POS = [
      {n: 'AS', x: 0}, {n: 'KOP', x: 1}, {n: 'KEPALA', x: 2}, {n: 'EKOR', x: 3}
    ];
    const RM_NAMES = ["R01 Phantom Edge","R02 Shadow Index","R03 Night Blade","R04 Void Pulse","R05 Ghost Bridge","R06 Dark Mirror","R07 Venom Drift","R08 Silent Spike","R09 Dead Zone","R10 Hex Cutter","R11 Zero Cross","R12 Skull Shift","R13 Toxic Morph","R14 Black Helix","R15 Iron Gate","R16 Reaper Flux","R17 Ash Spiral","R18 Grave Lock","R19 Doom Cycle","R20 Final Axe","R21 Twin AS Strike","R22 Kop Mirror Delta","R23 Cross Line Death","R24 Mystic Cross Sum","R25 Beta Edge Clash","R26 Hybrid 4D Sum","R27 Taysen Tail Echo","R28 Raw Head Strike","R29 Index Inner Cross","R30 Mystic Total Kill","R31 Taysen Cross Multiplex","R32 Kop-Ekor Squared Drop","R33 Front Cascade Mist","R34 Twin Index Clash","R35 Head-Tail Inversion","R36 Double Mistis Core","R37 Outer Cross Index","R38 Biji 2D Backward","R39 Absolute Delta 4D","R40 Phantom Tesson Strike","R41 Double Tail Strike","R42 Kop-Kepala Cross Index","R43 Mystic 3D Rear","R44 As-Ekor Multiplier","R45 Inner Resonance Mist","R46 Taysen Alpha-Omega","R47 Cross Wing Squared","R48 Index Gap Shift","R49 Past Biji Multiplier","R50 Taysen Triple Front","R51 Master Moegywara666"];
    
    const posResults: any = {};
    
    POS.forEach(p => {
      const SA: Record<string, number> = {};
      const MK = Object.keys(_0x3ca571('0000', '0000'));
      MK.forEach(k => { SA[k] = 0; });
      for (let i = 0; i < 14; i++) {
        const pr: any = _0x3ca571(U[i], U[i + 1]), tg = U[i + 2];
        const val = parseInt(tg[p.x]);
        MK.forEach(k => { if (pr[k] !== val) SA[k] += 1; });
      }

      const stats = MK.map((k, idx) => ({ key: k, name: RM_NAMES[idx], score: SA[k], lolos: SA[k] >= 14 }));
      
      const fq: Record<string, number> = {};
      for (let d = 0; d <= 9; d++) fq[String(d)] = 0;
      U.forEach(r => { fq[r[p.x]]++; });

      const rc: Record<string, number> = {};
      for (let d = 0; d <= 9; d++) rc[String(d)] = 99;
      for (let j = U.length - 1; j >= 0; j--) {
        const dg = U[j][p.x];
        if (rc[dg] === 99) rc[dg] = (U.length - 1 - j);
      }

      let el = MK.filter(k => SA[k] >= 14);
      if (el.length === 0) {
        const mx = Math.max(...MK.map(k => SA[k]));
        el = MK.filter(k => SA[k] === mx);
      }

      const FP: any = _0x3ca571(D[D.length - 2], D[D.length - 1]);
      const ct: Record<string, number> = {};
      el.forEach(k => { const v = String(FP[k]); ct[v] = (ct[v] || 0) + 1; });

      const sr = Object.keys(ct).sort((a, b) => {
        if (ct[b] !== ct[a]) return ct[b] - ct[a];
        const ga = (rc[a] || 99) === 99 ? 1 : 0, gb = (rc[b] || 99) === 99 ? 1 : 0;
        if (ga !== gb) return ga - gb;
        if ((fq[b] || 0) !== (fq[a] || 0)) return (fq[b] || 0) - (fq[a] || 0);
        return (rc[a] || 99) - (rc[b] || 99);
      });
      
      const offDigits = sr.slice(0, param);
      const filteredStats = stats.filter(s => s.lolos && offDigits.includes(String(FP[s.key])));
      
      posResults[p.n] = {
        stats: filteredStats,
        activeCount: filteredStats.length,
        result: offDigits
      };
    });

    return { success: true, data: posResults };
  }
  
  if (type === 'jumlah') {
    const SA: Record<string, number> = {};
    const MK = Object.keys(_0x3ca571('0000', '0000'));
    MK.forEach(k => { SA[k] = 0; });
    for (let i = 0; i < 14; i++) {
        const pr: any = _0x3ca571(U[i], U[i + 1]), tg = U[i + 2];
        const j2d = _0xJ2d(tg[2], tg[3]);
        MK.forEach(k => { if (pr[k] !== j2d) SA[k] += 1; });
    }

    const RM_NAMES = ["R01 Phantom Edge","R02 Shadow Index","R03 Night Blade","R04 Void Pulse","R05 Ghost Bridge","R06 Dark Mirror","R07 Venom Drift","R08 Silent Spike","R09 Dead Zone","R10 Hex Cutter","R11 Zero Cross","R12 Skull Shift","R13 Toxic Morph","R14 Black Helix","R15 Iron Gate","R16 Reaper Flux","R17 Ash Spiral","R18 Grave Lock","R19 Doom Cycle","R20 Final Axe","R21 Twin AS Strike","R22 Kop Mirror Delta","R23 Cross Line Death","R24 Mystic Cross Sum","R25 Beta Edge Clash","R26 Hybrid 4D Sum","R27 Taysen Tail Echo","R28 Raw Head Strike","R29 Index Inner Cross","R30 Mystic Total Kill","R31 Taysen Cross Multiplex","R32 Kop-Ekor Squared Drop","R33 Front Cascade Mist","R34 Twin Index Clash","R35 Head-Tail Inversion","R36 Double Mistis Core","R37 Outer Cross Index","R38 Biji 2D Backward","R39 Absolute Delta 4D","R40 Phantom Tesson Strike","R41 Double Tail Strike","R42 Kop-Kepala Cross Index","R43 Mystic 3D Rear","R44 As-Ekor Multiplier","R45 Inner Resonance Mist","R46 Taysen Alpha-Omega","R47 Cross Wing Squared","R48 Index Gap Shift","R49 Past Biji Multiplier","R50 Taysen Triple Front","R51 Master Moegywara666"];

    const ljList = _0xEngineJumlahMati(D, param);

    const FP: any = _0x3ca571(D[D.length - 2], D[D.length - 1]);
    const stats: any[] = [];
    let cnt = 0;

    MK.forEach((k, idx) => {
        if (SA[k] >= 14 && ljList.includes(String(FP[k]))) {
            stats.push({ name: RM_NAMES[idx], score: SA[k], lolos: true });
            cnt++;
        }
    });

    let el = MK.filter(k => SA[k] >= 14);
    if (el.length === 0) {
        const mx = Math.max(...MK.map(k => SA[k]));
        el = MK.filter(k => SA[k] === mx);
    }
    const eliteCount = el.filter(k => ljList.includes(String(FP[k]))).length;

    return { success: true, data: { result: ljList, stats, eliteTotal: el.length, supportCount: eliteCount } };
  }
  
  if (type === 'shio') {
    const SA: Record<string, number> = {};
    const MK = Object.keys(_0xRumusShio('0000', '0000'));
    MK.forEach(k => { SA[k] = 0; });
    for (let i = 0; i < 14; i++) {
        const pr: any = _0xRumusShio(U[i], U[i + 1]), sh = _0x2d4get(U[i + 2]);
        MK.forEach(k => { if (pr[k] !== sh) SA[k] += 1; });
    }

    const SHIO_RUMUS_NAMES = ["RS01 Lunar Blade", "RS02 Zodiac Drift", "RS03 Beast Helix", "RS04 Modulus Pulse", "RS05 Astral Gate","RS06 Night Zodiac", "RS07 Phantom Beast", "RS08 Void Modulus", "RS09 Lunar Zone", "RS10 Hex Zodiac","RS11 Zero Orbit", "RS12 Skull Shift", "RS13 Toxic Beast", "RS14 Dark Lunar", "RS15 Iron Modulus","RS16 Reaper Zodiac", "RS17 Ash Orbit", "RS18 Grave Cycle", "RS19 Doom Beast", "RS20 Final Modulus","RS21 Twin Zodiac Strike", "RS22 Lunar Mirror Delta", "RS23 Cross Beast Death", "RS24 Modulus Cross Sum", "RS25 Beta Lunar Clash","RS26 Hybrid Zodiac Sum", "RS27 Beast Tail Echo", "RS28 Raw Lunar Strike", "RS29 Orbit Inner Cross", "RS30 Zodiac Total Kill","RS31 Modulus Cross Multiplex", "RS32 Lunar Squared Drop", "RS33 Front Cascade Beast", "RS34 Twin Orbit Clash", "RS35 Zodiac Inversion","RS36 Double Modulus Core", "RS37 Outer Cross Lunar", "RS38 Beast 2D Backward", "RS39 Absolute Zodiac 4D", "RS40 Phantom Orbit Strike","RS41 Double Lunar Strike", "RS42 Beast Cross Matrix", "RS43 Modulus 3D Rear", "RS44 Lunar Multiplier", "RS45 Inner Resonance Beast","RS46 Zodiac Alpha-Omega", "RS47 Cross Wing Orbit", "RS48 Modulus Gap Shift", "RS49 Past Lunar Multiplier", "RS50 Zodiac Triple Front"];

    const ls = _0xEngineShioMati(D, param);

    const FP: any = _0xRumusShio(D[D.length - 2], D[D.length - 1]);
    const stats: any[] = [];
    let cnt = 0;
    
    const offResults = Array.isArray(ls) ? ls : [ls];
    
    MK.forEach((k, idx) => {
        if (SA[k] >= 14 && offResults.includes(FP[k])) {
            stats.push({ name: SHIO_RUMUS_NAMES[idx], score: SA[k], lolos: true });
            cnt++;
        }
    });

    let el = MK.filter(k => SA[k] >= 14);
    if (el.length === 0) {
        const mx = Math.max(...MK.map(k => SA[k]));
        el = MK.filter(k => SA[k] === mx);
    }
    
    let support = 0;
    const ct: Record<number, number> = {};
    el.forEach(k => {
        const v = FP[k];
        ct[v] = (ct[v] || 0) + 1;
    });
    
    offResults.forEach((h: number) => {
        support += (ct[h] || 0);
    });

    return { success: true, data: { result: ls, stats, eliteTotal: el.length, supportCount: support } };
  }

  return { success: false, message: "Type not supported yet" };
}
