import { type TargetPair } from "../../lib/analysis/customDigit";
import { MiniLabel } from "./Shared";

type PairAiMap = Partial<Record<TargetPair, 2 | 4 | 6 | null>>;
type PairBoolMap = Partial<Record<TargetPair, boolean>>;
type RecommendationBadge = "thumb" | "fire";
type RecommendedMap = Record<string, RecommendationBadge>;

const pairLabel: Record<TargetPair, string> = {
  depan: "DEPAN",
  tengah: "TENGAH",
  belakang: "BELAKANG",
};

const pairSubtitle: Record<TargetPair, string> = {
  depan: "AS - KOP",
  tengah: "KOP - KEPALA",
  belakang: "KEPALA - EKOR",
};

export default function CustomAiFilterSection({
  pair,
  meta,
  badges,
  customAiDigitByPair,
  setCustomAiDigitForPair,
  customAiParityByPair,
  setCustomAiParityForPair,
  customAiSizeByPair,
  setCustomAiSizeForPair,
}: {
  pair: TargetPair;
  meta: { accent: string; soft: string };
  badges: RecommendedMap;
  customAiDigitByPair: PairAiMap;
  setCustomAiDigitForPair: (pair: TargetPair, value: 2 | 4 | 6 | null) => void;
  customAiParityByPair: PairBoolMap;
  setCustomAiParityForPair: (pair: TargetPair, value: boolean) => void;
  customAiSizeByPair: PairBoolMap;
  setCustomAiSizeForPair: (pair: TargetPair, value: boolean) => void;
}) {
  const optionButton = (active: boolean, label: string, onClick: () => void, recommendKey?: string) => {
    const badge = recommendKey ? badges[recommendKey] : undefined;
    const isRecommended = Boolean(badge);
    return (
      <button
        type="button"
        onClick={onClick}
        className="ui-motion-soft ui-tap ui-lift relative rounded-3xl border p-4 text-center"
        style={{ borderColor: active ? meta.accent : isRecommended ? `${meta.accent}88` : "rgba(255,255,255,0.14)", backgroundColor: active ? meta.soft : "rgba(255,255,255,0.04)", color: active ? meta.accent : "var(--ui-text-muted)" }}
      >
        {badge && <span className="absolute right-3 top-2 text-[15px] leading-none">{badge === "fire" ? "🔥" : "👍"}</span>}
        <span className="block font-['Orbitron'] text-[13px] font-black uppercase tracking-[2px]">{label}</span>
      </button>
    );
  };

  return (
    <section className="ui-card space-y-2 rounded-3xl p-3">
      <MiniLabel>AI {pairLabel[pair]} · {pairSubtitle[pair]}</MiniLabel>
      <div className="grid grid-cols-3 gap-2">
        {[2, 4, 6].map((n) => optionButton(customAiDigitByPair[pair] === n, String(n), () => setCustomAiDigitForPair(pair, customAiDigitByPair[pair] === n ? null : n as 2 | 4 | 6), `ai-${pair}-${n}`))}
      </div>
      <div className="grid grid-cols-1 gap-2">
        {optionButton(Boolean(customAiParityByPair[pair]), "GANJIL GENAP", () => setCustomAiParityForPair(pair, !customAiParityByPair[pair]), `ai-${pair}-7`)}
        {optionButton(Boolean(customAiSizeByPair[pair]), "BESAR KECIL", () => setCustomAiSizeForPair(pair, !customAiSizeByPair[pair]), `ai-${pair}-8`)}
      </div>
    </section>
  );
}
