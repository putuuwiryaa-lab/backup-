import { jumlah2D, shioOf2D } from "./utils";

export type TargetPair = "depan" | "tengah" | "belakang";
export type CustomFocus = TargetPair | "3d" | "4d";
export type PositionKey = "as" | "kop" | "kepala" | "ekor";

export const CUSTOM_FOCUS_OPTIONS: Array<{ key: CustomFocus; title: string; subtitle: string }> = [
  { key: "depan", title: "2D DEPAN", subtitle: "AS - KOP" },
  { key: "tengah", title: "2D TENGAH", subtitle: "KOP - KEPALA" },
  { key: "belakang", title: "2D BELAKANG", subtitle: "KEPALA - EKOR" },
  { key: "3d", title: "3D", subtitle: "KOP - KEPALA - EKOR" },
  { key: "4d", title: "4D", subtitle: "AS - KOP - KEPALA - EKOR" },
];

export const customFocusLabel = (focus: CustomFocus) => CUSTOM_FOCUS_OPTIONS.find((item) => item.key === focus)?.title || "2D BELAKANG";
export const customFocusSubtitle = (focus: CustomFocus) => CUSTOM_FOCUS_OPTIONS.find((item) => item.key === focus)?.subtitle || "KEPALA - EKOR";

export const customFocusPositions = (focus: CustomFocus): PositionKey[] => {
  if (focus === "depan") return ["as", "kop"];
  if (focus === "tengah") return ["kop", "kepala"];
  if (focus === "3d") return ["kop", "kepala", "ekor"];
  if (focus === "4d") return ["as", "kop", "kepala", "ekor"];
  return ["kepala", "ekor"];
};

export const customFocusPairs = (focus: CustomFocus): TargetPair[] => {
  if (focus === "depan") return ["depan"];
  if (focus === "tengah") return ["tengah"];
  if (focus === "3d") return ["tengah", "belakang"];
  if (focus === "4d") return ["depan", "tengah", "belakang"];
  return ["belakang"];
};

export const customFocusPositionLabels: Record<PositionKey, string> = {
  as: "AS",
  kop: "KOP",
  kepala: "KEPALA",
  ekor: "EKOR",
};

const pairDigits = (line: Record<PositionKey, number>, pair: TargetPair) => {
  if (pair === "depan") return [line.as, line.kop];
  if (pair === "tengah") return [line.kop, line.kepala];
  return [line.kepala, line.ekor];
};

export const buildCustomDigitLines = ({
  focus = "belakang",
  aiByPair,
  bbfsByPair,
  includeBBFS,
  offAs = [],
  offKop = [],
  offKepala = [],
  offEkor = [],
  jumlahByPair,
  shioByPair,
}: {
  focus?: CustomFocus;
  aiByPair?: Partial<Record<TargetPair, number[]>>;
  bbfsByPair?: Partial<Record<TargetPair, number[]>>;
  includeBBFS: boolean;
  offAs?: number[];
  offKop?: number[];
  offKepala?: number[];
  offEkor?: number[];
  jumlahByPair?: Partial<Record<TargetPair, number[]>>;
  shioByPair?: Partial<Record<TargetPair, number[]>>;
  ai?: number[];
  bbfs?: number[];
  offJumlah?: number[];
  offShio?: number[];
}) => {
  const positions = customFocusPositions(focus);
  const pairs = customFocusPairs(focus);
  const offByPosition: Record<PositionKey, number[]> = { as: offAs, kop: offKop, kepala: offKepala, ekor: offEkor };
  const lines: string[] = [];

  const isAllowed = (line: Record<PositionKey, number>) => {
    for (const position of positions) {
      if ((offByPosition[position] || []).includes(line[position])) return false;
    }
    for (const pair of pairs) {
      const [a, b] = pairDigits(line, pair);
      const ai = aiByPair?.[pair] || [];
      const bbfs = bbfsByPair?.[pair] || [];
      const offJumlah = jumlahByPair?.[pair] || [];
      const offShio = shioByPair?.[pair] || [];
      if (ai.length && !ai.includes(a) && !ai.includes(b)) return false;
      if (includeBBFS && (!bbfs.includes(a) || !bbfs.includes(b))) return false;
      if (offJumlah.includes(jumlah2D(a, b))) return false;
      if (offShio.includes(shioOf2D(a * 10 + b))) return false;
    }
    return true;
  };

  const walk = (index: number, line: Record<PositionKey, number>) => {
    if (index >= positions.length) {
      if (isAllowed(line)) lines.push(positions.map((position) => line[position]).join(""));
      return;
    }
    const position = positions[index];
    for (let digit = 0; digit <= 9; digit++) walk(index + 1, { ...line, [position]: digit });
  };

  walk(0, { as: 0, kop: 0, kepala: 0, ekor: 0 });
  return lines;
};
