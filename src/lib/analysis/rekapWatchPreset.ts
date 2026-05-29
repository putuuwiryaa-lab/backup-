import type { CustomFocus, TargetPair } from "./customDigit";

export type PairAiMap = Partial<Record<TargetPair, 2 | 4 | 6 | null>>;
export type PairCountMap = Partial<Record<TargetPair, number | null>>;
export type PairBooleanMap = Partial<Record<TargetPair, boolean>>;

export type RekapWatchPreset = {
  market_id?: string;
  focus?: CustomFocus;
  filters?: any;
};

export function readRekapWatchPreset(marketId: string): RekapWatchPreset | null {
  const raw = sessionStorage.getItem("supreme_rekap_watch_preset");
  if (!raw) return null;
  try {
    const preset = JSON.parse(raw) as RekapWatchPreset;
    if (!preset || preset.market_id !== marketId) return null;
    sessionStorage.removeItem("supreme_rekap_watch_preset");
    return preset;
  } catch {
    return null;
  }
}

export function presetAiMap(filters: any): PairAiMap {
  const output: PairAiMap = {};
  Object.entries(filters?.aiByPair || {}).forEach(([pair, value]) => {
    const count = Number(value);
    if ([2, 4, 6].includes(count)) output[pair as TargetPair] = count as 2 | 4 | 6;
  });
  return output;
}

export function presetBooleanMap(filters: any): PairBooleanMap {
  const output: PairBooleanMap = {};
  Object.entries(filters?.bbfsByPair || {}).forEach(([pair, value]) => {
    output[pair as TargetPair] = Boolean(value);
  });
  return output;
}

export function presetCountMap(value: any): PairCountMap {
  const output: PairCountMap = {};
  Object.entries(value || {}).forEach(([pair, count]) => {
    const numberValue = Number(count);
    if (numberValue > 0) output[pair as TargetPair] = numberValue;
  });
  return output;
}
