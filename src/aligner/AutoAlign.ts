import { Path, Point } from "paper/dist/paper-core";

const autoAlignOptions = {
  strokeColor: "red",
  strokeWidth: 1,
};

const initialAlignThresholdDistance = 5;

export class AutoAlign {
  private referencePoints: paper.Point[];
  private guidePaths: {
    x?: paper.Path[];
    y?: paper.Path[];
  } = { x: [], y: [] };

  constructor(referencePoints: paper.Point[] = []) {
    this.referencePoints = referencePoints;
  }

  setReferencePoints = (points: paper.Point[]) => {
    this.referencePoints = points;
  };

  /**
   *
   * @param point point to align.
   * @param ignorePointRef a point instance reference to be ignored when
   * aligning. Used to avoid aligning a point to itself.
   * @param showGuides
   * @returns
   */
  autoAlign = (
    point: paper.Point,
    ignorePointRef: paper.Point,
    showGuides: boolean = true
  ): paper.Point => {
    return this.maybeAlign(point, ignorePointRef, showGuides);
  };

  clearGuides = (): void => {
    this.removeGuidePath("x");
    this.removeGuidePath("y");
  };

  private maybeAlign = (
    originalPoint: paper.Point,
    ignorePointRef: paper.Point,
    showGuides: boolean
  ): paper.Point => {
    this.clearGuides();

    let newPoint = originalPoint;
    /**
     * We want to align the guides to the nearest point, otherwise some points
     * may be never aligned to in case their distance to another point is below
     * the threshold.
     *
     * Example (inside the `forEach`):
     *
     * 1 step.
     *    a. originalPoint.x = 50; refPoint.x = 54,
     *    b. result: newPoint.x = 54, a lineguide is drawn.
     *
     * 2 step.
     *    a. originalPoint.x = 50; refPoint.x = 53,
     *    b. result: newPoint.x = 53, previous lineguide is eliminated, new one
     * is drawn.
     */

    let thresholdX = initialAlignThresholdDistance;
    let thresholdY = initialAlignThresholdDistance;

    this.referencePoints.forEach((referencePoint: paper.Point) => {
      if (ignorePointRef === referencePoint) {
        return;
      }

      // TODO maybe refactor to reuse same function for x and y axises. This
      // code is somewhat fragile, so be careful when editing it, and refactor
      // it if possible.

      // Check the distance of the Original point and the current Reference
      // point, so we can check if this reference passes the threshold and
      // should be used for the alignment.
      const xAxisesDistance = Math.abs(originalPoint.x - referencePoint.x);
      // Check less or equal `<=`, so a guideline could be drawn to other points
      // on the exact same axis position. If it was checked "less than" only
      // `<`, only the first point on the exact same position would have a
      // guideline.
      if (xAxisesDistance <= thresholdX) {
        // Update the threshold, so alignment can be made to the nearest point.
        thresholdX = xAxisesDistance;
        newPoint = this.alignPointToAxis("x", newPoint, referencePoint);

        if (showGuides) {
          this.redrawGuide("x", newPoint, referencePoint);
        }
      }

      const yAxisesDistance = Math.abs(originalPoint.y - referencePoint.y);
      if (yAxisesDistance <= thresholdY) {
        thresholdY = yAxisesDistance;
        newPoint = this.alignPointToAxis("y", newPoint, referencePoint);

        if (showGuides) {
          this.redrawGuide("y", newPoint, referencePoint);
        }
      }
    });

    return newPoint;
  };

  private alignPointToAxis = (
    axis: "x" | "y",
    point: paper.Point,
    refrencePoint: paper.Point
  ): paper.Point => {
    const unaffectedAxis = axis === "x" ? "y" : "x";

    const newPoint = new Point({
      // This is the axis that gets aligned.
      [axis]: refrencePoint[axis],
      // This remains the same.
      [unaffectedAxis]: point[unaffectedAxis],
    });

    return newPoint;
  };

  private removeGuidePath = (guideKey: "x" | "y"): void => {
    this.guidePaths[guideKey].forEach((path) => path.remove());
    this.guidePaths[guideKey] = [];
  };

  private redrawGuide = (
    guideKey: "x" | "y",
    point: paper.Point,
    guideToPoint: paper.Point
  ): void => {
    const existentPath = this.guidePaths[guideKey][0];

    // We can draw the guides to multiple points on the same axis position, but
    // we should make sure them aren't on different positions, e.g.: of
    // `guideKey` is `x` their `x1` and `x2` should be equal. If they are not,
    // remove the existent one.
    if (existentPath?.lastSegment.point[guideKey] !== point[guideKey]) {
      this.removeGuidePath(guideKey);
    }

    this.guidePaths[guideKey].push(
      this.createGuidePath(point.clone(), guideToPoint.clone())
    );
  };

  private createGuidePath = (
    point1: paper.Point,
    point2: paper.Point
  ): paper.Path => {
    return new Path({
      segments: [point1, point2],
      strokeColor: autoAlignOptions.strokeColor,
      strokeWidth: autoAlignOptions.strokeWidth,
      // The guides are only visual and shall not interfere with any elements or
      // hit testing.
      locked: true,
    });
  };
}
