import { OutlineSegmentView } from "./OutlineSegmentView";
import { Segment } from "paper/dist/paper-core";

export class OutlineSegment extends Segment {
  data: {
    segmentView?: OutlineSegmentView;
    [key: string]: any;
  } = {};
}
