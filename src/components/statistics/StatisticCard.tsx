import {
  type MarketStatistic,
  type RelatedStatsMap,
  badgeLabel,
  bbfsScopeSubtitle,
  marketUrl,
  movementText,
  movementTone,
  positionPairSubtitle,
  relatedLabels,
  statAccent,
  statAccentSoft,
  statGold,
  statTitle,
} from "../../lib/statistics/statisticsPageUtils";

export default function StatisticCard({
  item,
  index,
  relatedStats,
  onOpen,
}: {
  item: MarketStatistic;
  index: number;
  relatedStats: RelatedStatsMap;
  onOpen: (url: string) => void;
}) {
  const marketName = item.market_name || item.market_id;
  const topRank = index === 0;
  const alsoLabels = relatedLabels(item, relatedStats);
  const movement = movementText(item.rank_movement);
  const tone = movementTone(item);

  return (
    <div
      key={item.id || `${item.market_id}-${item.group_key}-${item.param}-${item.position}-${item.target_pair}-${item.analysis_scope}`}
      className="rounded-[1.55rem] border p-3 text-left shadow-xl"
      style={{
        borderColor: topRank ? "rgba(246,201,107,0.55)" : "rgba(255,255,255,0.11)",
        background: topRank ? "linear-gradient(135deg,rgba(246,201,107,0.16),rgba(52,211,153,0.08))" : "rgba(8,12,18,0.78)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex w-14 shrink-0 flex-col items-center gap-1.5">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl font-['Orbitron'] text-[13px] font-black"
            style={{ background: topRank ? statGold : statAccentSoft, color: topRank ? "#120d02" : statAccent }}
          >
            #{index + 1}
          </div>
          {movement && (
            <span
              className="mt-1 flex min-h-7 min-w-14 items-center justify-center rounded-xl border px-3 py-1.5 font-['Orbitron'] text-[12px] font-black leading-none tracking-[0.7px]"
              style={{ color: tone.text, backgroundColor: tone.bg, borderColor: tone.border, boxShadow: tone.shadow }}
            >
              {movement}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-['Orbitron'] text-[16px] font-black uppercase tracking-[2px] text-[var(--text)]">{marketName}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[1.2px]" style={{ color: statAccent }}>{statTitle(item)}</p>
              {item.group_key === "off_digit" && <p className="mt-1 text-[9px] font-black uppercase tracking-[1px] text-[var(--text-dim)]">{positionPairSubtitle(item.target_pair)}</p>}
              {item.group_key === "bbfs" && <p className="mt-1 text-[9px] font-black uppercase tracking-[1px] text-[var(--text-dim)]">{bbfsScopeSubtitle(item.analysis_scope)}</p>}
            </div>
            <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[9px] font-black uppercase tracking-[1px]" style={{ color: statGold }}>{badgeLabel(item)}</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-black/25 p-2">
              <p className="text-[8px] font-black uppercase tracking-[1px] text-[var(--text-dim)]">Riwayat</p>
              <p className="font-['Orbitron'] text-[13px] font-black" style={{ color: statGold }}>{item.wins_15}/15</p>
            </div>
            <div className="rounded-xl bg-black/25 p-2">
              <p className="text-[8px] font-black uppercase tracking-[1px] text-[var(--text-dim)]">Terbaru</p>
              <p className="font-['Orbitron'] text-[13px] font-black" style={{ color: statAccent }}>{item.wins_last_5}/5</p>
            </div>
          </div>

          {alsoLabels.length > 0 && (
            <div className="mt-3 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-2">
              <p className="text-[8px] font-black uppercase tracking-[1.4px] text-[var(--text-dim)]">Juga unggul</p>
              <p className="mt-1 text-[10px] font-black uppercase leading-4 tracking-[1px]" style={{ color: statAccent }}>{alsoLabels.join(" · ")}</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => onOpen(marketUrl(item))}
            className="mt-3 w-full rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-[1.4px] active:scale-[0.985]"
            style={{ background: topRank ? statGold : statAccentSoft, color: topRank ? "#120d02" : statAccent }}
          >
            Buka Pasaran
          </button>
        </div>
      </div>
    </div>
  );
}
