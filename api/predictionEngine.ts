import { _0xJ2d } from './engines/tables.js';
import { _0x3ca571, RM_NAMES } from './engines/offFormula.js';
import { _0xEngineJumlahMati } from './engines/jumlahEngine.js';
import { _0x2d4get, _0xRumusShio, SHIO_RUMUS_NAMES, _0xEngineShioMati } from './engines/shioEngine.js';
import { _0x9a025f, _0xe57f0c, _0xEngineAI } from './engines/aiEngine.js';
import { runRekap } from './engines/rekapEngine.js';

type AiVote = Record<number, number>;
type AnalysisScope = 'default' | '4d' | '3d' | '2d_depan' | '2d_tengah' | '2d_belakang';
type RunAnalysisOptions = { analysisScope?: AnalysisScope; forceDigitResult?: boolean };

function aiTargetIndexes(scope: AnalysisScope = 'default') {
  if (scope === '4d') return [0, 1, 2, 3];
  if (scope === '3d') return [1, 2, 3];
  return [2, 3];
}

function topVoteDigit(vote: AiVote) {
  return Object.keys(vote)
    .map((k) => ({ d: parseInt(k), v: vote[parseInt(k)] }))
    .sort((a, b) => (b.v !== a.v ? b.v - a.v : a.d - b.d))[0]?.d ?? 0;
}

function buildAiParity(vote: AiVote) {
  const evenVote = vote[0] + vote[2] + vote[4] + vote[6] + vote[8];
  const oddVote = vote[1] + vote[3] + vote[5] + vote[7] + vote[9];
  const tieDigit = topVoteDigit(vote);
  const dominant = evenVote > oddVote ? 'GENAP' : oddVote > evenVote ? 'GANJIL' : tieDigit % 2 === 0 ? 'GENAP' : 'GANJIL';
  return { dominant, evenVote, oddVote };
}

function buildAiSize(vote: AiVote) {
  const smallVote = vote[0] + vote[1] + vote[2] + vote[3] + vote[4];
  const bigVote = vote[5] + vote[6] + vote[7] + vote[8] + vote[9];
  const tieDigit = topVoteDigit(vote);
  const dominant = bigVote > smallVote ? 'BESAR' : smallVote > bigVote ? 'KECIL' : tieDigit >= 5 ? 'BESAR' : 'KECIL';
  return { dominant, bigVote, smallVote };
}

function buildAiVote(D: string[], targetIndexes = [2, 3]) {
  const U = D.slice(-17);
  const sr = [];
  let elitCount = 0;
  const vote: AiVote = {};
  for (let d = 0; d <= 9; d++) vote[d] = 0;

  for (let r = 0; r < _0x9a025f.length; r++) {
    const rm = _0x9a025f[r];
    let hits = 0, valid = 0;
    for (let i = 0; i < 14; i++) {
      const prev2 = U[i], prev = U[i + 1], curr = U[i + 2], tgt = U[i + 3];
      const ai = rm.f(curr, prev, prev2);
      if (ai === null) continue;
      valid++;
      if (targetIndexes.some((index) => ai.includes(parseInt(tgt[index])))) hits++;
    }
    const thr = _0xe57f0c[rm.dg] || 10;
    const lolos = hits >= thr;
    sr.push({ name: rm.n, dg: rm.dg, hits, valid, thresh: thr, lolos });

    if (lolos) {
      const fp = rm.f(D[D.length - 1], D[D.length - 2], D[D.length - 3]);
      if (fp !== null) {
        elitCount++;
        for (let j = 0; j < fp.length; j++) vote[fp[j] as number]++;
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

  return { sr, elitCount, vote, fallback };
}

export function runAnalysis(type: string, payload: string[], param: number, options: RunAnalysisOptions = {}) {
  const D = payload;
  const U = D.slice(-17);
  const analysisScope = options.analysisScope || 'default';
  const forceDigitResult = options.forceDigitResult === true;

  // ── REKAP ─────────────────────────────────────────────────────────────────
  if (type === 'rekap') {
    return runRekap(D, param);
  }

  // ── AI ────────────────────────────────────────────────────────────────────
  if (type === 'ai' || type === 'ai_parity' || type === 'ai_size') {
    const targetIndexes = aiTargetIndexes(analysisScope);
    const { sr, elitCount, vote, fallback } = buildAiVote(D, targetIndexes);
    const aiResultParam = forceDigitResult ? param : type === 'ai' && param !== 7 && param !== 8 ? param : 6;
    const aiResult = _0xEngineAI(D, aiResultParam);
    const parity = buildAiParity(vote);
    const size = buildAiSize(vote);
    const stats = sr.filter(s => s.lolos);

    if (!forceDigitResult && (type === 'ai_parity' || (type === 'ai' && param === 7))) {
      return { success: true, data: { stats, elitCount, fallback, result: [parity.dominant], parity, sourceResult: aiResult, displayLabel: 'GANJIL GENAP', evaluationMode: 'ai_parity', evaluationParam: 1 } };
    }

    if (!forceDigitResult && (type === 'ai_size' || (type === 'ai' && param === 8))) {
      return { success: true, data: { stats, elitCount, fallback, result: [size.dominant], size, sourceResult: aiResult, displayLabel: 'BESAR KECIL', evaluationMode: 'ai_size', evaluationParam: 1 } };
    }

    return {
      success: true,
      data: { stats, elitCount, fallback, result: aiResult, parity, size }
    };
  }

  // ── MATI ──────────────────────────────────────────────────────────────────
  if (type === 'mati') {
    const POS = [
      { n: 'AS', x: 0 }, { n: 'KOP', x: 1 }, { n: 'KEPALA', x: 2 }, { n: 'EKOR', x: 3 }
    ];
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
        if ((fq[a] || 0) !== (fq[b] || 0)) return (fq[a] || 0) - (fq[b] || 0);
        return (rc[b] || 99) - (rc[a] || 99);
      });

      const offDigits = sr.slice(0, param);
      const filteredStats = stats.filter(s => s.lolos && offDigits.includes(String(FP[s.key])));

      posResults[p.n] = { stats: filteredStats, activeCount: filteredStats.length, result: offDigits };
    });

    return { success: true, data: posResults };
  }

  // ── JUMLAH ────────────────────────────────────────────────────────────────
  if (type === 'jumlah') {
    const SA: Record<string, number> = {};
    const MK = Object.keys(_0x3ca571('0000', '0000'));
    MK.forEach(k => { SA[k] = 0; });
    for (let i = 0; i < 14; i++) {
      const pr: any = _0x3ca571(U[i], U[i + 1]), tg = U[i + 2];
      const j2d = _0xJ2d(tg[2], tg[3]);
      MK.forEach(k => { if (pr[k] !== j2d) SA[k] += 1; });
    }

    const ljList = _0xEngineJumlahMati(D, param);
    const FP: any = _0x3ca571(D[D.length - 2], D[D.length - 1]);
    const stats: any[] = [];

    MK.forEach((k, idx) => {
      if (SA[k] >= 14 && ljList.includes(String(FP[k]))) {
        stats.push({ name: RM_NAMES[idx], score: SA[k], lolos: true });
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

  // ── SHIO ──────────────────────────────────────────────────────────────────
  if (type === 'shio') {
    const SA: Record<string, number> = {};
    const MK = Object.keys(_0xRumusShio('0000', '0000'));
    MK.forEach(k => { SA[k] = 0; });
    for (let i = 0; i < 14; i++) {
      const pr: any = _0xRumusShio(U[i], U[i + 1]), sh = _0x2d4get(U[i + 2]);
      MK.forEach(k => { if (pr[k] !== sh) SA[k] += 1; });
    }

    const ls = _0xEngineShioMati(D, param);
    const FP: any = _0xRumusShio(D[D.length - 2], D[D.length - 1]);
    const stats: any[] = [];
    const offResults = Array.isArray(ls) ? ls : [ls];

    MK.forEach((k, idx) => {
      if (SA[k] >= 14 && offResults.includes(FP[k])) {
        stats.push({ name: SHIO_RUMUS_NAMES[idx], score: SA[k], lolos: true });
      }
    });

    let el = MK.filter(k => SA[k] >= 14);
    if (el.length === 0) {
      const mx = Math.max(...MK.map(k => SA[k]));
      el = MK.filter(k => SA[k] === mx);
    }

    let support = 0;
    const ct: Record<number, number> = {};
    el.forEach(k => { const v = FP[k]; ct[v] = (ct[v] || 0) + 1; });
    offResults.forEach((h: number) => { support += (ct[h] || 0); });

    return { success: true, data: { result: ls, stats, eliteTotal: el.length, supportCount: support } };
  }

  return { success: false, message: "Type not supported yet" };
}
