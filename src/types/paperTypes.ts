/**
 * PaperJS automatically compiles the types definitions, that means that some
 * types are missing.
 *
 * Add the Paper specific types here.
 * Add only what's necessary, no need to overdo.
 */

export type PaperViewEventKey =
  | "frame"
  | "resize"
  | "mousedown"
  | "mouseup"
  | "mousedrag"
  | "click"
  | "doubleclick"
  | "mousemove"
  | "mouseenter"
  | "mouseleave";

export type PaperToolEventKey =
  | "mousedown"
  | "mouseup"
  | "mousedrag"
  | "mousemove"
  | "keydowm"
  | "keyup";

// @see {@link: http://paperjs.org/reference/view/#onframe}
export interface FrameEvent extends paper.Event {
  count: number;
  time: number;
  delta: number;
}

export type PaperViewEventHandlers = {
  resize?: (event: paper.Event) => void;
  frame?: (event: FrameEvent) => void;
} & {
  [key in Exclude<PaperViewEventKey, "resize" | "frame">]?: (
    event: paper.MouseEvent
  ) => void;
};

/**
 * N.B.: this type may be incomplete.
 */
export type PaperPathJSONData = {
  name: string;
  segments: [x: number, y: number][];
  // TODO if needed, provide more props for intellisense.
  [key: string]: any;
};

export type PaperPathJSON = ["Path", PaperPathJSONData];

export interface HitOptions {
  tolerance?: number;
  class?: Function;
  match?: Function;
  fill: boolean;
  stroke: boolean;
  segments: boolean;
  curves?: boolean;
  handles?: boolean;
  ends?: boolean;
  center?: boolean;
  bounds?: boolean;
  guides?: boolean;
  selected?: boolean;
}

export function initHitOptions(options?: Partial<HitOptions>): HitOptions {
  
  const hitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    /**
     * We are interested to hit the Dots (used primarly to drag them), thus we
     * rely on them being big enough.
     *
     * To assist the final User with the dots alignments (including to close the
     * path) we use the AutoAligner.
     *
     * If you would need to increment this, be ware that it could create some
     * conflicts with the alignment, for example:
     * 1. The mouse is close enough to hit a Dot (because of a high `tolerance`).
     * 2. But it's not close enough to align it.
     * 3. The User would expect to add a dot on click, while because a Dot was
     *    hit, it will drag instead.
     *
     */
    tolerance: 0,
  };

  return {
    ...hitOptions,
    ...options
  };
}
