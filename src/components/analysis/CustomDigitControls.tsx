import type { ReactNode } from "react";
import { MiniLabel } from "./Shared";

export type RecommendationBadge = "thumb" | "fire";

export function CustomDigitOptionButton({
  active,
  label,
  onClick,
  accent,
  soft,
  extraClass = "",
  badge,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  accent: string;
  soft: string;
  extraClass?: string;
  badge?: RecommendationBadge;
}) {
  const isRecommended = Boolean(badge);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${extraClass} ui-motion-soft ui-tap ui-lift relative rounded-3xl border p-4 text-center`}
      style={{
        borderColor: active ? accent : isRecommended ? `${accent}88` : "rgba(255,255,255,0.14)",
        backgroundColor: active ? soft : "rgba(255,255,255,0.04)",
        color: active ? accent : "var(--ui-text-muted)",
      }}
    >
      {badge && <span className="absolute right-3 top-2 text-[15px] leading-none">{badge === "fire" ? "🔥" : "👍"}</span>}
      <span className="ui-font-display block text-[13px] font-black uppercase tracking-[2px]">{label}</span>
    </button>
  );
}

export function CustomDigitSection({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <section className="ui-card space-y-2 rounded-3xl p-3">
      <MiniLabel>{label}</MiniLabel>
      {children}
    </section>
  );
}

export function ThreeColumnOptions({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-3 gap-2">{children}</div>;
}

export function SingleColumnOptions({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-2">{children}</div>;
}
