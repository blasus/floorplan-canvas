import { Color, Path, Point } from "paper/dist/paper-core";
import { Colors, pickColorFromRange } from "../constants";
import {
  OutlineConstructorOptions,
  OutlineData,
  OutlineEventPayload,
  OutlineEvents,
  OutlineOptions,
  PaperPathJSON,
  PaperViewEventHandlers,
  PaperViewEventKey,
  initHitOptions,
} from "../types";
import emitter, { Handler, WildcardHandler } from "mitt";

import { AutoAlign } from "../aligner";
import { LayerItem } from "../items";
import { OutlinePathPreview } from "./OutlinePathPreview";
import { OutlineSegment } from "./OutlineSegment";
import { OutlineSegmentView } from "./OutlineSegmentView";
import { UndoManager } from "../undo-redo";

// Maybe could become `OutlineOptions` or smt like that.
const DEFAULT_OPTIONS: OutlineOptions = {
  pathColor: new Color(Colors.black),
  pathWidth: 1,
  fillColorClosed: new Color(Colors.transparentGray),
  fillColorOpen: new Color("transparent"),
  strokeJoin: "round",
};

const INACTIVE_OUTLINE_OPTIONS: Partial<OutlineOptions> = {
  pathWidth: 2,
} as const;

const ACTIVE_OUTLINE_OPTIONS: Partial<OutlineOptions> = {
  pathColor: new Color(Colors.outlineActive),
  pathWidth: 3,
} as const;

export class Outline extends LayerItem {
  name: string;
  private options: OutlineOptions;
  private path: paper.Path;
  private autoAligner: AutoAlign;
  private segmentViewHit: OutlineSegmentView;
  private isFirstSegmentHit: boolean = false;
  private pathPreview: OutlinePathPreview;
  // Because the autoaligning functionality is used, we need to save the aligned
  // point and use it when adding a new dot (path segment). If the
  // `paper.MouseEvent` was used, it would add the current mouse position, and
  // not the aligned one. Paper doesn't align the mouse cursor :).
  // - Currently it's set by the path preview functionality.
  // - Start the candidate (and the preview) out of the canvas view, otherwise,
  //   when you start a new Outline with the mouse out of the canvas (e.g.
  //   pressing a button "add outline"), it will add a hanging dot on the
  //   canvas.
  private newSegmentPointCadidate: paper.Point = new Point(-50, -50);
  private viewEventsEnabled: boolean = false;
  private defaultActiveOptions = {
    ...DEFAULT_OPTIONS,
    ...ACTIVE_OUTLINE_OPTIONS,
  };
  private defaultInactiveOptions = {
    ...DEFAULT_OPTIONS,
    ...INACTIVE_OUTLINE_OPTIONS,
    pathColor: pickColorFromRange(),
  };
  private isActive = true;

  private emitter = emitter<OutlineEvents>();
  on = this.emitter.on;
  off = this.emitter.off;

  constructor({
    name,
    segments,
    closed = false,
    layer,
    aligner,
    events,
    options = DEFAULT_OPTIONS,
  }: OutlineConstructorOptions) {
    // Group all the Outline elements on it's own layer.
    super({ layer, events });

    this.name = name;
    this.autoAligner = aligner;

    this.path = new Path({
      name,
    });
    this.setOptions(options);
    this.layer.addChild(this.path);

    if (segments) {
      segments.forEach((point) =>
        this.addSegmentToPath(new Point(point), Symbol())
      );

      if (closed) {
        this.closePath();
      }
    }

    // Should not interfere with other instances, @see `destroy` for further
    // explanation.
    UndoManager.getInstance().clear();
  }

  destroy = () => {
    /**
     * If the `UndoManager` is used in an instance, it will possibly reference a
     * removed instance. Thus, clear the `UndoManager`, otherwise it should not
     * be used here at all.
     *
     * N.B.: If you need to refactor this, and allow more complex UNDOs, give a
     * look at Memento pattern (Manager would get Outlines state and restore it).
     *
     * This is needed only if we want to allow undo/redo multiple outlines
     * creation and modification. Considering the current specs, client needs to
     * exlicitly create, save or remove outlines. I.e. if an Outlines is
     * "saved", it can only be removed, not undone.
     */
    UndoManager.getInstance().clear();
    this.deactivate();
  };

  handleViewEvent = (eventKey: PaperViewEventKey, event): void => {
    if (this.viewEventsEnabled) {
      this.viewEventHandlers[eventKey]?.(event);
    }
  };

  viewEventHandlers: PaperViewEventHandlers = {
    mousedown: (event: paper.MouseEvent): void => {
      // Do nothing if path is closed.
      if (this.path.closed) {
        return;
      }
      // Close path and hide preview.
      if (this.isFirstSegmentHit) {
        this.closePathWithUndo();
        // Reset hit target to disable immediate drag after closing (mouse is
        // down, so drag is activated), which could accidentaly move the current
        // dot.
        this.segmentViewHit = null;
        this.isFirstSegmentHit = false;

        this.removePathPreview();

        return;
      }

      // Add new segment if there's no segment hit, so it can be dragged,
      // for example.
      if (!this.segmentViewHit) {
        this.addSegmentToPathWithUndo(this.newSegmentPointCadidate);

        return;
      }
    },
    mousedrag: (event: paper.MouseEvent): void => {
      const point = event.point.clone();

      if (this.pathPreview) {
        this.removePathPreview();
      }

      if (this.segmentViewHit) {
        this.dragSegment(point, this.segmentViewHit);
      }
    },
    mousemove: (event: paper.MouseEvent): void => {
      // Check and show preview only when mouse is on canvas. `mouseenter` is
      // bad, because there's no way to know if mouse is entered when Outline is
      // manually activated.
      this.maybeAddPathPreview();

      // If path is closed we don't need any functionality enabled by this
      // handler, only the segments drag which is handled in the `mousedrag`
      // handler, so we only do a hittest for the current mouse position.
      if (this.path.closed) {
        this.hitTest(event.point.clone());

        return;
      }
      /**
       * The current mouse point may be used for:
       *
       * - displaying a preview for the next dot;
       * - to add new segment;
       * - to hitTest which may be used for drag or to close the path.
       * - etc.
       *
       * Thus, to keep those functionality in sync and avoid conflicts, we align
       * the point right here, before it's used by all this features.
       */
      const alignedPoint = this.autoAligner.autoAlign(
        event.point.clone(),
        undefined,
        !!this.pathPreview
      );
      this.newSegmentPointCadidate = alignedPoint;
      // Hit test current item or items to complex interactions, for example
      // drag the currently hit item.
      this.hitTest(alignedPoint);

      // Assit path closing and clear guides.
      // N.B.: Now the path is open, we only assist point positioning and
      // preview the styles.
      if (this.isFirstSegmentHit) {
        // Preview closed path style (just fill).
        this.setOptions({ fillColorOpen: this.options.fillColorClosed });
        this.autoAligner.clearGuides();
        this.pathPreview.updatePreviewPosition(
          this.path.lastSegment?.point,
          this.path.firstSegment?.point
        );

        return;
      }

      // Reset open fill color for open path.
      this.setOptions({ fillColorOpen: DEFAULT_OPTIONS.fillColorOpen });
      // Show path preview while mouse is moving.
      this.dragPreview(alignedPoint);
    },
    mouseup: (event: paper.MouseEvent): void => {
      // Guides are used when dragging, so clear them once it's ended.
      this.autoAligner.clearGuides();
    },
    mouseleave: (event: paper.MouseEvent): void => {
      // Hide preview when canvas is left.
      this.removePathPreview();
      this.autoAligner.clearGuides();
    },
  };

  getData = (): OutlineData => {
    const paperPathJSON = (this.path.exportJSON({
      asString: false,
    }) as unknown) as PaperPathJSON;

    return {
      name: paperPathJSON[1].name,
      edges: paperPathJSON[1].segments,
    };
  };

  getPathPoints = (): paper.Point[] => {
    return this.path.segments.map((segment) => segment.point);
  };

  setOptions = (options: Partial<OutlineOptions> = {}) => {
    this.options = Object.assign({}, this.options, options);
    const {
      pathColor,
      pathWidth,
      strokeJoin,
      fillColorClosed,
      fillColorOpen,
    } = this.options;

    if (this.path.closed) {
      this.path.set({
        fillColor: fillColorClosed,
      });
    } else {
      this.path.set({
        fillColor: fillColorOpen,
      });
    }

    this.path.set({
      strokeColor: pathColor,
      strokeWidth: pathWidth,
      strokeJoin: strokeJoin,
    });

    this.path.segments.forEach((segment) => {
      (segment as OutlineSegment).data.segmentView.setOptions({
        fill: pathColor,
        strokeColor: pathColor,
      });
    });
  };

  /**
   * Set outlines options to default.
   */
  resetOptions = () => {
    if (this.isActive) {
      this.setOptions(this.defaultActiveOptions);
    } else {
      this.setOptions(this.defaultInactiveOptions);
    }
  };

  closePathWithUndo = (): void => {
    // Prevent closing 1 or 2 dots path.
    if (this.path.segments.length < 3) {
      return;
    }

    this.closePath();

    UndoManager.getInstance().add({
      undo: () => {
        this.openPath();
      },
      redo: () => {
        this.closePath();
      },
    });
  };

  openPathWithUndo = (): void => {
    this.openPath();

    UndoManager.getInstance().add({
      undo: () => {
        this.closePath();
      },
      redo: () => {
        this.openPath();
      },
    });
  };

  activate(): void {
    this.layer.locked = false;
    this.setOptions(this.defaultActiveOptions);
    this.viewEventsEnabled = true;
    this.isActive = true;

    if (this.events["*"]) {
      this.on("*", this.events["*"] as WildcardHandler<OutlineEvents>);
    }

    if (this.events["change"]) {
      this.on("change", this.events["change"] as Handler<OutlineEventPayload>);
    }
  }

  deactivate(): void {
    this.emitter.all.clear();
    this.layer.locked = true;
    this.isActive = false;
    this.setOptions(this.defaultInactiveOptions);
    this.removePathPreview();
    this.viewEventsEnabled = false;
  }

  private maybeAddPathPreview = () => {
    if (this.pathPreview || this.path.closed) {
      return;
    }

    // If `this.path` has no segments, we preview only a dot.
    const startPoint =
      this.path.lastSegment?.point || this.newSegmentPointCadidate;

    this.pathPreview = new OutlinePathPreview(
      startPoint,
      this.newSegmentPointCadidate
    );
    this.layer.addChild(this.pathPreview.group);
  };

  private removePathPreview = () => {
    this.pathPreview?.group.remove();
    this.pathPreview = undefined;
  };

  private closePath = (): void => {
    this.path.closed = true;
    // Reset options for closed path.
    this.setOptions();

    this.emitEvent("close");
  };

  private openPath = (): void => {
    this.path.closed = false;
    // Reset options for open path.
    this.setOptions();

    this.emitEvent("open");
  };

  private addSegmentToPath = (
    point: paper.Point,
    segmentViewKey: Symbol
  ): void => {
    const segmentView = new OutlineSegmentView(
      {
        point,
        options: {
          strokeColor: this.options.pathColor,
          fill: this.options.pathColor,
        },
      },
      segmentViewKey
    );
    this.path.add(segmentView.segment);
    this.layer.addChild(segmentView.group);

    this.emitEvent("addDot");
  };

  private removeSegmentFromPath = (segmentViewKey: Symbol): void => {
    const segment = (this.path.segments as OutlineSegment[]).find(
      (segment) => segment.data.segmentView.uniqueKey === segmentViewKey
    );
    const segmentView = segment?.data?.segmentView;

    if (segmentView) {
      segmentView.group.remove();
      segmentView.segment.remove();

      this.emitEvent("removeDot");
    }
  };

  private addSegmentToPathWithUndo = (point: paper.Point) => {
    const segmentViewKey = Symbol();
    this.addSegmentToPath(point, segmentViewKey);

    // Make sure to have the original coordinates.
    const redoPoint = point.clone();
    UndoManager.getInstance().add({
      undo: () => {
        this.removeSegmentFromPath(segmentViewKey);
      },
      redo: () => {
        this.addSegmentToPath(redoPoint, segmentViewKey);
      },
    });
  };

  private dragSegment = (
    point: paper.Point,
    segmentView: OutlineSegmentView
  ): void => {
    const maybeNewPoint = this.autoAligner.autoAlign(
      point,
      segmentView.segment.point
    );
    segmentView.updatePosition(maybeNewPoint);

    this.emitEvent("drag");
  };

  private dragPreview = (point: paper.Point): void => {
    const outlinePathLastSegmentPoint = this.path.lastSegment?.point;
    // Drag.
    this.pathPreview.updatePreviewPosition(outlinePathLastSegmentPoint, point);
  };

  private hitTest = (point: paper.Point): void => {
    const hitResult = this.layer.project.hitTest(point, initHitOptions());

    this.segmentViewHit = hitResult && hitResult.item.data?.segmentView;
    this.isFirstSegmentHit =
      this.segmentViewHit &&
      this.segmentViewHit.segment === this.path.firstSegment;
  };

  private emitEvent = (type: keyof OutlineEvents) => {
    const jsonPath = this.getData();

    this.emitter.emit(type, { path: jsonPath });

    // Emit a generic change event.
    if (type !== "change") {
      this.emitter.emit("change", { path: jsonPath });
    }
  };
}
