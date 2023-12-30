import { OutlineSegmentView } from "./OutlineSegmentView";
import { Path } from "paper/dist/paper-core";

export class OutlineDot extends Path.Circle {
  data: {
    isDot: true;
    segmentView?: OutlineSegmentView;
    [key: string]: any;
  } = {
    isDot: true,
  };
}
