import { DetailToggle, LineBox, SectionTitle } from "./Shared";
import { buildAngkaJadi } from "../../lib/analysis/utils";
import { angkaJadiModes } from "../../lib/analysis/constants";

export default function AngkaJadiPanel({ type, result, open, setOpen, meta }: {
  type: string;
  result: any;
  open: boolean;
  setOpen: (fn: (value: boolean) => boolean) => void;
  meta: { accent: string; soft: string };
}) {
  if (!result || !angkaJadiModes.has(type)) return null;
  const data = buildAngkaJadi(type, result);

  return (
    <div className="ui-panel ui-motion-in space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle accent={meta.accent} title="Angka Jadi" />
        <DetailToggle open={open} accent={meta.accent} onClick={() => setOpen((value) => !value)} />
      </div>
      {open && (
        <div className="ui-motion-in space-y-3 pt-1">
          {data.sections.map((section) => <LineBox key={section.label} label={section.label} lines={section.lines} accent={meta.accent} soft={meta.soft} />)}
        </div>
      )}
    </div>
  );
}
