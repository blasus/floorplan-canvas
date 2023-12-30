import { Point, Raster } from "paper/dist/paper-core";
import { SVGSource, SvgSizing, SvgUploaderConstructorOptions } from "../types";

import { LayerItem } from "../items";

export class SVGUploader extends LayerItem {
  public src: SVGSource;
  private _project: paper.Project;
  private _canvas: HTMLCanvasElement;
  private _svgItem: paper.Item;
  private _onLoadCallback: Function;

  constructor({
    src,
    project,
    canvas,
    onLoad,
    layer,
  }: SvgUploaderConstructorOptions) {
    super({ layer });
    this.src = src;
    this._project = project;
    this._canvas = canvas;
    this._onLoadCallback = onLoad;
  }

  public loadSVG(options?: SvgSizing): void {
    if (this.src) {
      this.layer.activate();
      this._svgItem?.remove();

      // use Raster object to improve performances
      this._svgItem = new Raster({
        source: this.src,
        onLoad: () => {
          if (options) {
            this.resizeSVG(options);
          } else {
            this.fitIntoViewSVG();
          }

          if (this._onLoadCallback) {
            this._onLoadCallback();
          }
        },
      });
    }
  }

  public getSvgBounds = (): paper.Rectangle => {
    return this._svgItem.bounds;
  };

  public resizeSVG = (options: SvgSizing): void => {
    const svg = this._svgItem;

    const ratioW = options.width / svg.bounds.width;
    const ratioH = options.height / svg.bounds.height;

    svg.scale(ratioW, ratioH);
    // After the scale, the bounds are changed.
    svg.position = new Point(
      options.topLeft.x + svg.bounds.width / 2,
      options.topLeft.y + svg.bounds.height / 2
    );
  };

  /**
   * Resize the svg making it always centered on the canvas.
   */
  public fitIntoViewSVG(): void {
    if (this._svgItem) {
      const canvas = this._canvas;
      const cWidth = canvas.scrollWidth;
      const cHeight = canvas.scrollHeight;
      const svg = this._svgItem;
      const { width, height } = svg.bounds;
      const ratio = Math.min(cWidth / (width + 30), cHeight / (height + 30));
      if (width * ratio <= cWidth && height * ratio < cHeight) {
        svg.scale(ratio);
      }
      svg.position = new Point(cWidth / 2, cHeight / 2);
    }
  }

  public remove(): void {
    this._svgItem?.remove();
    this._svgItem = undefined;
    this.src = undefined;
  }
}
