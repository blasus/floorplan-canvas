import "./styles.scss";

import { Manager } from "../../src";
import OutlineDemo from "./outlines";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const manager = new Manager(
  canvas
  /* {
   *   svg: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Typical_Dogtrot_Floorplan.svg',
   *   maxZoom: 4,
   *   minZoom: 0.5,
   *   undoLimit: 10
   * }
   */
);

const exportButton = document.getElementById("export") as HTMLButtonElement;
exportButton.addEventListener("click", () => {
  const json = manager.exportAsJson();
  console.log(json);
  alert(json);
});

const exportStringButton = document.getElementById("exportString") as HTMLButtonElement;
exportStringButton.addEventListener("click", () => {
  const json = manager.exportAsString();
  console.log(json);
  alert(json);
})

const addGridButton = document.getElementById("addGrid") as HTMLButtonElement;
addGridButton.addEventListener("click", () => {
  manager.drawGrid();
});

const svgInput = document.getElementById("svgLoader") as HTMLInputElement;
svgInput.addEventListener("change", function (event) {
  const file = this.files[0];
  if (!file.type.startsWith("image/svg+xml")) {
    return;
  }
  manager.loadSVG({
    src: window.URL.createObjectURL(file),
    onLoad: () => {
      console.log("svg uploaded!", manager.getSvgSizing());
    },
  });
});

const removeSvgButton = document.getElementById("removeSvg") as HTMLButtonElement;
removeSvgButton.addEventListener("click", () => {
  manager.removeSvg();
  svgInput.value = '';
});

const cellInput = document.getElementById("cellSize") as HTMLInputElement;
cellInput.addEventListener("change", (e) => {
  manager.drawGrid(+cellInput.value);
});

// zoom in
const zoomIn = document.getElementById("zoomIn") as HTMLButtonElement;
zoomIn.addEventListener("click", (e) => {
  manager.zoomIn();
});
// zoom out
const zoomOut = document.getElementById("zoomOut") as HTMLButtonElement;
zoomOut.addEventListener("click", (e) => {
  manager.zoomOut();
});
// reset
const zoomReset = document.getElementById("zoomReset") as HTMLButtonElement;
zoomReset.addEventListener("click", (e) => {
  manager.resetZoom();
});
// toggle pan mode
const panMode = document.getElementById("panMode") as HTMLButtonElement;
panMode.addEventListener("click", (e) => {
  manager.togglePanMode();
  if (manager.isPanModeEnabled) {
    panMode.className = panMode.className + " active";
  } else {
    panMode.className = panMode.className.split(" active")[0];
  }
});
// undo button
const undo = document.getElementById("undoButton") as HTMLButtonElement;
undo.addEventListener("click", (e) => {
  manager.undo();
});
// redo button
const redo = document.getElementById("redoButton") as HTMLButtonElement;
redo.addEventListener("click", (e) => {
  manager.redo();
});

OutlineDemo(manager);
