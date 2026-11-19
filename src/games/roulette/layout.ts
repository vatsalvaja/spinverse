/**
 * Geometry of the European betting table, in table units. The same layout is produced for a landscape table
 * ("h": 12 columns of 3 numbers, zero at the left) and a portrait one ("v": rotated a quarter turn clockwise,
 * 3 columns by 12 rows with zero on top) so phones get cells they can actually press.
 *
 * Every betting position, including the splits, streets, corners and six lines that sit on the lines between
 * numbers, gets a hit box. The bet ids match the engine's `betDef` ids, which is what decides what a bet covers.
 */

import { RED, type Color } from "./engine";

export type Orient = "h" | "v";
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Cell {
  id: string;
  label: string;
  box: Box;
  kind: "zero" | "number" | "column" | "dozen" | "even";
  n?: number;
  tone: Color | "felt";
  /** short even-money symbol drawn instead of text: a red or black diamond */
  diamond?: "red" | "black";
}
export interface Spot {
  id: string;
  label: string;
  box: Box;
  kind: "split" | "street" | "corner" | "sixline";
}
export interface TableLayout {
  w: number;
  h: number;
  cells: Cell[];
  spots: Spot[];
  /** width of a unit divided by its height: the table is drawn with this cell shape */
  cellAspect: number;
}

const HW = 14;
const HH = 5;

/** a box in the landscape layout -> the same box in the portrait layout (a quarter turn clockwise) */
const turn = (b: Box): Box => ({ x: HH - (b.y + b.h), y: b.x, w: b.h, h: b.w });

/** the number at a given column (0-11) and row (0 = top row: 3, 6, 9 ...; 2 = bottom row: 1, 4, 7 ...) */
const numAt = (c: number, r: number) => c * 3 + (3 - r);

export function tableLayout(orient: Orient): TableLayout {
  const t = (b: Box) => (orient === "v" ? turn(b) : b);
  const cells: Cell[] = [];
  const spots: Spot[] = [];

  cells.push({ id: "straight:0", label: "0", box: t({ x: 0, y: 0, w: 1, h: 3 }), kind: "zero", n: 0, tone: "green" });
  for (let c = 0; c < 12; c++) {
    for (let r = 0; r < 3; r++) {
      const n = numAt(c, r);
      cells.push({ id: `straight:${n}`, label: String(n), box: t({ x: 1 + c, y: r, w: 1, h: 1 }), kind: "number", n, tone: RED.has(n) ? "red" : "black" });
    }
  }
  for (let k = 1; k <= 3; k++) cells.push({ id: `column:${k}`, label: "2 to 1", box: t({ x: 13, y: 3 - k, w: 1, h: 1 }), kind: "column", tone: "felt" });
  const dozens = ["1st 12", "2nd 12", "3rd 12"];
  for (let d = 1; d <= 3; d++) cells.push({ id: `dozen:${d}`, label: dozens[d - 1], box: t({ x: 1 + 4 * (d - 1), y: 3, w: 4, h: 1 }), kind: "dozen", tone: "felt" });
  const even: [string, string, "red" | "black" | undefined][] = [
    ["low", "1 – 18", undefined],
    ["even", "Even", undefined],
    ["red", "Red", "red"],
    ["black", "Black", "black"],
    ["odd", "Odd", undefined],
    ["high", "19 – 36", undefined],
  ];
  even.forEach(([id, label, diamond], i) => cells.push({ id, label, box: t({ x: 1 + i * 2, y: 4, w: 2, h: 1 }), kind: "even", tone: "felt", diamond }));

  // hit boxes on the lines between numbers (size in table units)
  const T = 0.4;
  const at = (cx: number, cy: number, w: number, h: number): Box => t({ x: cx - w / 2, y: cy - h / 2, w, h });
  // splits: left-right neighbours (n, n+3) straddle the vertical line, up-down neighbours (n, n+1) the horizontal line
  for (let c = 0; c < 11; c++)
    for (let r = 0; r < 3; r++) {
      const a = numAt(c, r);
      spots.push({ id: `split:${a}-${a + 3}`, label: `Split ${a}/${a + 3}`, box: at(2 + c, r + 0.5, T, 0.46), kind: "split" });
    }
  for (let c = 0; c < 12; c++)
    for (let r = 1; r < 3; r++) {
      const a = numAt(c, r); // lower number, the row below
      spots.push({ id: `split:${a}-${a + 1}`, label: `Split ${a}/${a + 1}`, box: at(1.5 + c, r, 0.46, T), kind: "split" });
    }
  for (let r = 0; r < 3; r++) {
    const n = numAt(0, r);
    spots.push({ id: `split:0-${n}`, label: `Split 0/${n}`, box: at(1, r + 0.5, T, 0.46), kind: "split" });
  }
  // streets and six lines sit on the line under the three rows
  for (let c = 0; c < 12; c++) spots.push({ id: `street:${c * 3 + 1}`, label: `Street ${c * 3 + 1}-${c * 3 + 3}`, box: at(1.5 + c, 3, 0.46, T), kind: "street" });
  for (let c = 0; c < 11; c++) spots.push({ id: `sixline:${c * 3 + 1}`, label: `Six line ${c * 3 + 1}-${c * 3 + 6}`, box: at(2 + c, 3, T, T), kind: "sixline" });
  // corners where four numbers meet
  for (let c = 0; c < 11; c++)
    for (let r = 1; r < 3; r++) {
      const a = numAt(c, r);
      spots.push({ id: `corner:${a}`, label: `Corner ${a}/${a + 1}/${a + 3}/${a + 4}`, box: at(2 + c, r, T, T), kind: "corner" });
    }

  return orient === "v" ? { w: HH, h: HW, cells, spots, cellAspect: 1.8 } : { w: HW, h: HH, cells, spots, cellAspect: 1.25 };
}

/** centre of a box as fractions of the table, for placing a chip */
export const centre = (b: Box, l: TableLayout) => ({ x: ((b.x + b.w / 2) / l.w) * 100, y: ((b.y + b.h / 2) / l.h) * 100 });
