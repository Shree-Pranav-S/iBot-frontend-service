export const CARD_MIN_H = 210;
export const CARD_MIN_W = 290;
export const SIDEBAR_CARD_MIN_H = 92;
export const GRID_GAP = 12;

export interface GridCapacity {
  cols: number;
  rows: number;
  pageSize: number;
}

export function computeGridCapacity(
  width: number,
  height: number,
  minW: number,
  minH: number,
  maxCols = 3,
): GridCapacity {
  if (width <= 0 || height <= 0) {
    return { cols: 1, rows: 1, pageSize: 1 };
  }

  const cols = Math.max(
    1,
    Math.min(maxCols, Math.floor((width + GRID_GAP) / (minW + GRID_GAP))),
  );

  const rows = Math.max(1, Math.floor((height + GRID_GAP) / (minH + GRID_GAP)));
  return { cols, rows, pageSize: cols * rows };
}
