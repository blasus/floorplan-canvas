import { Color, Path } from "paper/dist/paper-core";

import { Colors } from "../constants";
import { GroupItem } from "../items";
import { OutlineSegment } from "./OutlineSegment";
import { OutlineSegmentView } from "./OutlineSegmentView";

const previewOptions = {
  strokeColor: new Color(Colors.outlineActive),
  strokeWidth: 3,
};

/**
 * `OutlinePathPreview` is used to show a preview of the next `Segment` for the
 * `Outline` path.
 *
 *   - It draws a `Path` with 2 segments.
 *   - It does nothing, it's up to you to update the position of the segments.
 *   - The view of the 2nd segment is hardcoded by using `OutlineSegmentView`,
 *     could be made configurable in case of necessity (like used by other
 *     classes).
 *   - It's not meant to have any interaction and pass the `hitTest` - it's
 *     purely a visual component. So, if you would ever need to change this
 *     behaviour, make it optional or create another class altogether.
 *
 * Usage example:  the 1st segment of the `OutlinePathPreview` would have the
 * position of the last segment of the `Outline` path, and the 2nd segment of
 * the `OutlinePathPreview` is positioned whereever a next segment for the
 * `Outline` path could be, for example following the mouse position.
 */
export class OutlinePathPreview extends GroupItem {
  path: paper.Path;
  private dotSegmentView: OutlineSegmentView;

  /**
   *
   * @param point Starting point for the `Path` segments.
   */
  constructor(startPoint: paper.Point, endPoint: paper.Point) {
    super();
    // Add dot like segment.
    this.path = new Path([[startPoint]]);
    this.path.strokeColor = previewOptions.strokeColor;
    this.path.strokeWidth = previewOptions.strokeWidth;
    this.createPreviewSegment(endPoint);

    this.group.addChild(this.path);
    // It's only visual and should not interact.
    this.group.locked = true;
  }

  private createPreviewSegment = (point: paper.Point): void => {
    this.dotSegmentView = new OutlineSegmentView({
      point,
      options: { strokeColor: previewOptions.strokeColor },
    });
    this.path.add(this.dotSegmentView.segment);

    this.group.addChild(this.dotSegmentView.group);
  };

  getLastSegment(): OutlineSegment {
    return this.path.lastSegment as OutlineSegment;
  }

  /**
   * Update the position of the preview segments.
   * @param startPoint position for the 1st segment.
   * @param endPoint position for the 2nd segment.
   */
  updatePreviewPosition = (
    startPoint: paper.Point,
    endPoint: paper.Point
  ): void => {
    // If there's no start point, set it to the end point.
    this.path.firstSegment.point = startPoint || endPoint;
    this.path.lastSegment.point = endPoint;
    this.dotSegmentView.dot.position = endPoint;
  };
}
