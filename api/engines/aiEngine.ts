import { AI_I, AI_L, AI_B, AI_T, AI_P, _0xc3c54e, _0xJ2d } from './tables';

export const _0xe57f0c: Record<number, number> = { 4: 11, 5: 12, 6: 13 };

export const _0x9a025f = [
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
      const X = +c[2]; const IDX = AI_I[X];
      return Array.from(new Set([X, _0xc3c54e(X - 1), IDX, _0xc3c54e(IDX - 1)]));
    }, dg: 4
  },
  {
    n: "R27 master moegywara666",
    f: (c: string, p: string, p2: string) => {
      const A = +c[0]; const K = +c[1];
      return Array.from(new Set([_0xJ2d(A, K), _0xc3c54e(A + 1), _0xc3c54e(A + 2), AI_I[A]]));
    }, dg: 4
  },
  {
    n: "R28 master moegywara666",
    f: (c: string, p: string, p2: string) => {
      const X = _0xJ2d(c[2], c[3]); const MB = AI_B[X];
      return Array.from(new Set([X, MB, _0xc3c54e(MB + 2)]));
    }, dg: 3
  },
  {
    n: "R29 master moegywara666",
    f: (c: string, p: string, p2: string) => {
      const X = +c[3];
      return Array.from(new Set([X, _0xc3c54e(X - 1), _0xc3c54e(X - 2), _0xc3c54e(X + 3), _0xc3c54e(X + 4)]));
    }, dg: 5
  },
  {
    n: "R30 Cosmic Chain",
    f: (c: string, p: string, p2: string) => {
      const X = (+c[0] + +c[2]) % 10; const MB = AI_B[X]; const IDX = AI_I[MB]; const ML = AI_L[IDX];
      return Array.from(new Set([X, MB, IDX, ML]));
    }, dg: 4
  },
  {
    n: "R31 Cipher Loop",
    f: (c: string, p: string, p2: string) => {
      const KOP = +c[1]; const EIDX = AI_I[+c[3]]; const sum = KOP + EIDX;
      const base = sum > 9 ? (Math.floor(sum / 10) + (sum % 10)) : sum;
      return Array.from(new Set([_0xc3c54e(base), _0xc3c54e(base + 2), _0xc3c54e(base + 4), _0xc3c54e(base + 6)]));
    }, dg: 4
  },
  {
    n: "R32 Reverse Pulse",
    f: (c: string, p: string, p2: string) => {
      if (!p) return null; const X = +p[3];
      return Array.from(new Set([_0xc3c54e(X), _0xc3c54e(X - 2), _0xc3c54e(X - 4), _0xc3c54e(X - 6), _0xc3c54e(X - 8)]));
    }, dg: 5
  },
  {
    n: "R33 Mid Spiral",
    f: (c: string, p: string, p2: string) => {
      const biji = _0xJ2d(c[1], c[2]); const base = _0xc3c54e(biji - 1);
      return Array.from(new Set([base, _0xc3c54e(base + 1), _0xc3c54e(base + 3), _0xc3c54e(base + 4)]));
    }, dg: 4
  },
  {
    n: "R34 Hex Surge",
    f: (c: string, p: string, p2: string) => {
      const biji = _0xJ2d(c[2], c[3]); const X = _0xc3c54e(biji + 6);
      return Array.from(new Set([X, _0xc3c54e(X + 2), _0xc3c54e(X + 3), _0xc3c54e(X + 7)]));
    }, dg: 4
  },
  {
    n: "R35 Step Six",
    f: (c: string, p: string, p2: string) => {
      const X = _0xc3c54e(+c[3] - 1);
      return Array.from(new Set([X, _0xc3c54e(X + 1), _0xc3c54e(X + 2), _0xc3c54e(X + 3), _0xc3c54e(X + 4), _0xc3c54e(X + 5)]));
    }, dg: 6
  },
];

export function _0xEngineAI(D: string[], param: number = 6) {
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
