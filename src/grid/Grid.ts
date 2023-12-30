import { Color, Path, Point } from "paper/dist/paper-core";

import { GridConstructorOptions } from "../types";
import { LayerItem } from "../items";

export class Grid extends LayerItem {
  private _view: paper.View;
  private _cellSize: number;
  private _gridLines: paper.Path.Line[] = [];
  private readonly _color: paper.Color = new Color("#A6A6A6");

  constructor({ view, cellSize, layer }: GridConstructorOptions) {
    super({ layer });

    this._view = view;
    this._cellSize = cellSize;
    this._draw();
  }

  private _draw() {
    const boundingRect = this._view.bounds;
    const cellSize = this._cellSize;
    const vCellsNum = boundingRect.height / cellSize;
    const hCellsNum = boundingRect.width / cellSize;

    // remove all the existing lines of the grid, if available
    this.destroy();
    // and activate the assigned layer so it's ready to redraw the grid.
    this.layer.activate();

    for (let i = 0; i <= hCellsNum; i++) {
      var offsetXPos = Math.ceil(boundingRect.left / cellSize) * cellSize;
      var xPos = offsetXPos + i * cellSize;
      var topPoint = new Point(xPos, boundingRect.top);
      var bottomPoint = new Point(xPos, boundingRect.bottom);
      var line = new Path.Line(topPoint, bottomPoint);

      line.strokeColor = this._color;
      line.strokeWidth = 1 / this._view.zoom;
      this._gridLines.push(line);
    }

    for (let i = 0; i <= vCellsNum; i++) {
      var offsetYPos = Math.ceil(boundingRect.top / cellSize) * cellSize;
      var yPos = offsetYPos + i * cellSize;
      var leftPoint = new Point(boundingRect.left, yPos);
      var rightPoint = new Point(boundingRect.right, yPos);
      var line = new Path.Line(leftPoint, rightPoint);

      line.strokeColor = this._color;
      line.strokeWidth = 1 / this._view.zoom;
      this._gridLines.push(line);
    }
  }

  public redraw(sideLength?: number): void {
    if (sideLength) {
      this._cellSize = sideLength;
    }

    this._draw();
  }

  public destroy(): void {
    this._gridLines.forEach((line) => line.remove());
    this._gridLines = [];
  }
}
