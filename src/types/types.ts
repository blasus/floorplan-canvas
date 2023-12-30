import { EventType, Handler, WildcardHandler } from 'mitt';

import { AutoAlign } from "../aligner";
import { PaperPathJSONData } from "./paperTypes";

export interface OutlineData {
  name: string;
  edges: PaperPathJSONData["segments"];
}

export type EventHandlers = Record<EventType, Handler | WildcardHandler>;

export interface OutlineEventPayload {
  path: OutlineData;
}

// A type received by `mitt` emitter.
export type OutlineEvents = {
  addDot: OutlineEventPayload;
  removeDot: OutlineEventPayload;
  drag: OutlineEventPayload;
  close: OutlineEventPayload;
  open: OutlineEventPayload;
  change: OutlineEventPayload;
};

export interface ManagerOutlineEventHandlers extends EventHandlers {
  "*"?: (eventType: keyof ManagerOutlineEventHandlers, payload: OutlineEventPayload) => void;
  add?: (payload: OutlineEventPayload) => void;
  delete?: (payload: OutlineEventPayload) => void;
  drag?: (payload: OutlineEventPayload) => void;
  close?: (payload: OutlineEventPayload) => void;
  open?: (payload: OutlineEventPayload) => void;
  addDot?: (payload: OutlineEventPayload) => void;
  removeDot?: (payload: OutlineEventPayload) => void;
  change?: (payload: OutlineEventPayload) => void;
}

export function isHandler(handler: Handler | WildcardHandler): handler is Handler {
  return handler.length < 2;
}

export type ManagerOutlineEventKeys = keyof ManagerOutlineEventHandlers;

export interface OutlineOptions {
  pathColor?: paper.Color;
  pathWidth?: number;
  fillColorClosed?: paper.Color;
  fillColorOpen?: paper.Color;
  // @see http://paperjs.org/reference/item/#strokejoin.
  strokeJoin?: 'miter' |'round' | 'bevel' 
}

export interface GridConstructorOptions extends ItemConstructionOptions {
  view: paper.View;
  cellSize: number;
}

export type SVGSource = string | SVGElement;

export interface SvgUploaderConstructorOptions extends ItemConstructionOptions {
  src: SVGSource;
  project: paper.Project;
  canvas: HTMLCanvasElement;
  onLoad?: Function;
}

export interface SvgSizing {
  width: number; 
  height: number;
  topLeft: { x: number, y: number };
}

export type PointCoordinates = [x: number, y: number]  | {x: number, y: number}

export interface OutlineConstructorOptions extends ItemConstructionOptions {
  name: string;
  aligner: AutoAlign;
  segments?: PointCoordinates[];
  closed?: boolean;
  events?: ManagerOutlineEventHandlers;
  options?: Partial<OutlineOptions>;
}

/**
 * Note that some options of a `Path` are not editable after the initilization,
 * for example `radius`. Thus, put here the options that can be changed for the
 * shapes drawn in the OutlineSegmentView.
 */
export interface OutlineSegmentViewOptions {
  strokeColor?: paper.Color;
  fill?: paper.Color;
}

export interface OutlineSegmentViewConstructorOptions {
  point: paper.Point;
  radius?: number;
  options?: OutlineSegmentViewOptions;
}

export interface UndoCommand {
  undo: () => any;
  redo: () => any;
}

export interface ItemConstructionOptions {
  layer?: paper.Layer;
  events?: EventHandlers;
}

export interface ManagerOptions {
  maxZoom?: number;
  minZoom?: number;
  zoomStep?: number;
  showGrid?: boolean;
  undoLimit?: number;
  // Use this option if you want to control svg positioning and avoid automatic
  // position (and size) changes due to auto-resize.
  disableSvgAutoResize?: boolean;
}
