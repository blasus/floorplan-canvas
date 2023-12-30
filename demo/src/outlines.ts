import { OutlineEventPayload, PointCoordinates } from "../../src/types";

import { Color } from "paper/dist/paper-core";
import { Manager } from "../../src";

/**
 * Outlines land.
 *
 * Demo on using/interacting with outlines. You'll be guided through with the
 * comments.
 */
export default (manager: Manager) => {
  // *Skip, it's just UI setup for the demo.
  const { outlineOutput, btnNewOutline, renderOutlinesList } =
    setupUiControls();

  // CLient props.
  let shouldAskReference = false;
  let referenceLengthPxPerMeter;
  let outlines = [];
  let currentOutlineName: string;

/*
  // Uncomment to try adding an outline.   
  manager.addOutline({
    name:'test', 
    segments: [[10,10], [10, 150], [150, 50], [50, 10]], 
    closed: true
  })
 */

  /**
   * Client wants to listen to Outlines events to get their data and implement
   * the Client logic.
   *
   * Event payload contains:
   * {
   *    path: {
   *       name: string,
   *       edges: Array of [x, y]
   *    }
   *  }
   **/

  manager.onOutline = {
    // - when an outline is added, we save it's data, so we can referene it
    //   later by its `name`.
    // - disable the possibility of adding new outlines. Only one at a time.
    add: function ({ path }: OutlineEventPayload) {
      outlines.push(path);
      btnNewOutline.disabled = true;
      currentOutlineName = path.name;

      renderOutlinesList(outlines);
    },
    // - An outline was deleted, clear the Client's relative data.
    delete: function ({ path }) {
      outlines = outlines.filter((p) => p.name !== path?.name);

      // - If the current outline was deleted, reeanble the "new" button.
      if (currentOutlineName === path.name) {
        currentOutlineName = undefined;
        btnNewOutline.disabled = false;
      }

      renderOutlinesList(outlines);
    },
    // - Listen to `addDot`, so we can ask the "reference length". Client uses
    //   this only for the first Outline.
    // - Grid is resized to match the reference length.
    // - It also can be used to get the "reference point" for the grid.
    addDot: function ({ path }) {
      // - Check if the reference length should be asked.
      if (
        shouldAskReference &&
        path.edges.length === 2 &&
        !referenceLengthPxPerMeter
      ) {
        // - Ask to provide the length in meters.
        const length = getReferenceLength();
        // - Calc the how much 1 meter is worth in pixels.
        // - It can be used to update the grid side length.
        const pixelLength = getPointsDistance(path.edges[0], path.edges[1]);
        referenceLengthPxPerMeter = Number((pixelLength / length).toFixed(2));

        manager.drawGrid(referenceLengthPxPerMeter);

        // *Skip, just demo output.
        outlineOutput.textContent = `
       length ${length} meters
       pixels ${pixelLength} px
       reference ${referenceLengthPxPerMeter} pixels per 1 meter
     `;
      }
    },
    // - Outline is closed, we enable the button to create a new Outline.
    close: function ({}) {
      btnNewOutline.disabled = false;
    },
    // - Outline is open (probably with an Undo), disable the new button.
    open: function ({}) {
      btnNewOutline.disabled = true;
    },
  };

  /**
   * FAKE TOOLBAR.
   * Create / Remove / Close
   * !`window` is used only for the demo and its UI controls.
   */
  // *Skip this, just for demo to have unique names.
  let outlineCount = 0;
  // @ts-ignore
  window.createNewOutline = function () {
    manager.addOutline({
      name: `outline-${++outlineCount}`,
    });
  };

  // @ts-ignore
  window.deleteOutline = function (name: string) {
    manager.removeOutline(name);
  };

  // @ts-ignore
  window.closeCurrentOutline = function () {
    manager.closeCurrentOutline();
  };

  //@ts-ignore
  window.toggleAskReference = function (event) {
    // This is only for the demo, to avoid the annoying prompt to get the
    // reference length.
    shouldAskReference = event.target.checked;
  };

  // @ts-ignore
  window.highlight = function(name: string) {
    manager.setOutlineStyles(name, {
      fillColorClosed: new Color(255, 0, 0, 0.5),
      pathWidth: 5,
    });
  };

  // @ts-ignore
  window.unlight = function(name: string) {
    manager.resetOutlineStyles(name);
  };

  // *Skip this, just some calc for the reference length for the demo purpose
  // only.
  const getPointsDistance = ([x1, y1], [x2, y2]) => {
    const a = x1 - x2;
    const b = y1 - y2;

    return Number(Math.sqrt(a * a + b * b).toFixed(2));
  };

  const getReferenceLength = (
    message = "Set length in meters (number only)"
  ) => {
    const promptResponse = window.prompt(message);
    length = Number(promptResponse);
    length = Number.isNaN(length) ? 0 : length;

    if (!length) {
      return getReferenceLength("Invalid value, please type a number");
    }

    return length;
  };
};

const setupUiControls = () => {
  document.getElementById("outline-actions-container").innerHTML = `
 <button id="btn-new-outline" onclick="createNewOutline()">New</button> 
 <button onclick="closeCurrentOutline()">Close</button> 
 <label>
   <input type='checkbox' onchange="toggleAskReference(event)" />
   Ask length reference
 </label>
`;

  const outlinesListEl = document.getElementById("list-of-outlines");
  const outlineItemTemplate = (name: string) => `
    <li onmouseover="highlight('${name}')" 
        onmouseleave="unlight('${name}')">
      ${name}
        <button onclick="deleteOutline('${name}')">
          X
        </button>
    </li>
    `;

  return {
    btnNewOutline: document.getElementById(
      "btn-new-outline"
    ) as HTMLButtonElement,
    outlineOutput: document.getElementById("outline-output"),
    renderOutlinesList(outlines) {
      outlinesListEl.innerHTML = outlines
        .map((outline) => outlineItemTemplate(outline.name))
        .join("");
    },
  };
};
