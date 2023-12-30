import { Color, Group } from "paper/dist/paper-core";
import {
  OutlineSegmentViewConstructorOptions,
  OutlineSegmentViewOptions,
} from "../types";

import { GroupItem } from "../items";
import { OutlineDot } from "./OutlineDot";
import { OutlineSegment } from "./OutlineSegment";

const defaultDotOptions: OutlineSegmentViewOptions = {
  strokeColor: new Color("lightblue"),
  fill: new Color("white"),
};

const SEGMENT_VIEW_DEFAULT_RADIUS = 3;

/**
 * Creates a `Segment` with a custom view for the `Outline` path.
 *
 * N.B.: Paper's `Segment` don't have any properties to set a view, this why we
 * place a segment and it's view together.
 *
 * It's "components", like `OutlineSegment` or the `OutlineDot` hold a reference
 * to the instance of `OutlineSegmentView` which created them. This allows to
 * access its props or methods, for example to `segment` or to use the
 * `updatePosition`.
 *
 * *NOTE: TODO FUTURE: Maybe it could become a class that extends `Segment`. Or
 * maybe a class that extends `Segment` and accept a "view". Emphasize "maybe".
 */
export class OutlineSegmentView extends GroupItem {
  private options: OutlineSegmentViewOptions = defaultDotOptions;
  private radius: number;

  segment: OutlineSegment;
  dot: OutlineDot;
  uniqueKey: Symbol;

  /**
   *
   * @param point Starting position of the `OutlineSegmentView`.
   * @param options
   */
  constructor(
    {
      point,
      radius = SEGMENT_VIEW_DEFAULT_RADIUS,
      options,
    }: OutlineSegmentViewConstructorOptions,
    uniqueKey: Symbol = Symbol()
  ) {
    super();

    this.radius = radius;
    this.segment = this.createSegment(point);

    this.setOptions(options);
    this.uniqueKey = uniqueKey;
  }

  private createSegment = (point: paper.Point): OutlineSegment => {
    const segment = new OutlineSegment(point);
    const dot = this.createSegmentDot(point);

    dot.data.segmentView = this;
    segment.data.segmentView = this;

    return segment;
  };

  private createSegmentDot = (point: paper.Point): OutlineDot => {
    const circle = new OutlineDot({
      center: point,
      radius: this.radius,
    });

    this.dot = circle;
    this.group.addChild(circle);

    return circle;
  };

  updatePosition = (point: paper.Point): void => {
    this.segment.point = point;
    this.dot.position = point;
  };

  setOptions = (options: Partial<OutlineSegmentViewOptions>) => {
    this.options = Object.assign({}, this.options, options);

    this.dot.set({
      strokeColor: this.options.strokeColor,
      fillColor: this.options.fill,
    });
  };
}
