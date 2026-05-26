import { _0xJ2d } from './tables';
import { _0x3ca571 } from './offFormula';

export function _0xEngineJumlahMati(D: string[], param: number = 1) {
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
