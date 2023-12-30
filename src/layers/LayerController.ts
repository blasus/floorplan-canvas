import { Layer } from "paper/dist/paper-core";

/**
 * Singleton class responsible to handle the layers
 * of the whole tool.
 */
export class LayerController {
  private project: paper.Project;
  private static instance: LayerController;

  private constructor() {}

  public static getInstance(): LayerController {
    if (!LayerController.instance) {
      LayerController.instance = new LayerController();
    }

    return LayerController.instance;
  }

  public setProject(project: paper.Project): void {
    this.project = project;
    // As soon as the project is added,
    // add two initial layers which will be dedicated slots for grid and svg.
    const layer0 = this.getLayerAtIndex(0);
    if (!layer0) {
      // layer for grid
      this.addLayer();
    }
    // layer for svg
    this.addLayer();
  }

  public get activeLayer(): paper.Layer {
    return this.project.activeLayer;
  }

  public getLayerAtIndex(i: number): paper.Layer {
    return this.project.layers[i];
  }

  public activateTopLayer(): void {
    const lastLayer = this.getLayerAtIndex(this.project.layers.length - 1);
    lastLayer.activate();
  }

  public addLayer(children?: paper.Item[]): paper.Layer {
    return new Layer(children);
  }

  public removeLayer(layer: paper.Layer): void {
    layer.remove();
  }
}
