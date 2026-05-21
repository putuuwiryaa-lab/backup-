import { jumlah2D, shioOf2D } from "./utils";

export const buildCustomDigitLines = ({ ai, bbfs, includeBBFS, offKepala, offEkor, offJumlah, offShio }: {
  ai: number[];
  bbfs: number[];
  includeBBFS: boolean;
  offKepala: number[];
  offEkor: number[];
  offJumlah: number[];
  offShio: number[];
}) => {
  const lines: string[] = [];
  const useAI = ai.length > 0;
  for (let k = 0; k <= 9; k++) {
    for (let e = 0; e <= 9; e++) {
      if (useAI && !ai.includes(k) && !ai.includes(e)) continue;
      if (includeBBFS && (!bbfs.includes(k) || !bbfs.includes(e))) continue;
      if (offKepala.includes(k) || offEkor.includes(e)) continue;
      if (offJumlah.includes(jumlah2D(k, e))) continue;
      if (offShio.includes(shioOf2D(k * 10 + e))) continue;
      lines.push(`${k}${e}`);
    }
  }
  return lines;
};
