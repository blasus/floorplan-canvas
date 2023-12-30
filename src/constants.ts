import { Color } from "paper/dist/paper-core";

let colorIndex: number = 0;

const outlineColorsRange = [
  "#EF00BA",
  "#5D11FF",
  "#E8F641",
  "#00A7B5",
  "#56EC77",
  "#4B88FF",
  "#1D32F0",
  "#9817AD",
  "#5FC5FF",
  "#4F2DC1",
  "#2E276C",
  "#258AB2",
];

export const Colors = {
  black: "#000000",
  transparentGray: "rgba(0, 0, 0, 0.1)",
  outlineActive: "#B100DB"
}

export const pickColorFromRange: () => paper.Color = () => {
  if (colorIndex === outlineColorsRange.length) {
    colorIndex = 0;
  }

  return new Color(outlineColorsRange[colorIndex++]);
}

// this is the default value of number of cell to be rendered for the grid.
// TODO: should it be a parameter, especially on resizing the grid?
export const DEFAULT_NUMBER_CELL = 35;
// zoom constants
export const DEFAULT_MAX_ZOOM = 3;
export const DEFAULT_MIN_ZOOM = 1;
export const ZOOM_RATIO = 0.5;