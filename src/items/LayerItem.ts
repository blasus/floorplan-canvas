import { Layer } from "paper/dist/paper-core";
import { EventHandlers, ItemConstructionOptions } from "../types";

export abstract class LayerItem {
  layer: paper.Layer;
  events: EventHandlers;

  constructor({ 
    layer = new Layer(),
    events
  }: ItemConstructionOptions) {
    this.layer = layer;
    this.events = events;
  }
}
