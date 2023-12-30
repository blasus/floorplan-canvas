import { Group } from "paper/dist/paper-core";

export abstract class GroupItem {
  group: paper.Group;

  constructor(group: paper.Group = new Group()) {
    this.group = group;
  }
}
