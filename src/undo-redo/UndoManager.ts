import { UndoCommand } from "../types";

/**
 * This singleton class is a basic implementation of the multi-level undo
 * solution using the {@link https://en.wikipedia.org/wiki/Command_pattern UndoCommand design pattern}.
 *
 * Credits to {@link https://github.com/ArthurClemens/Javascript-Undo-Manager ArthurClemens' JS Undo Manager}.
 *
 * @example <caption>Example of usage</caption>
 *
 * const coordinates = { x, y };
 * const point = addPoint(coordinates);
 * // undo: remove the point
 * undoManager.add({
 *   undo: () => {
 *      removePoint(point);
 *   },
 *   redo: () => {
 *      addPoint(coordinates);
 *   }
 * });
 *
 * // Manager.ts
 * UndoManager
 *  .getInstance()
 *  .undo()
 *  .redo()
 *
 */
export class UndoManager {
  private static instance: UndoManager;
  private _commands: UndoCommand[] = [];
  private _index: number = -1;
  // the maximum number of commands in the stack.
  // 0 means no limit.
  private _limit: number = 0;
  private _isExecuting: boolean = false;
  private _callback: Function;

  private constructor() {}

  public static getInstance(): UndoManager {
    if (!UndoManager.instance) {
      UndoManager.instance = new UndoManager();
    }

    return UndoManager.instance;
  }

  get commands(): UndoCommand[] {
    return this._commands;
  }

  get index(): number {
    return this._index;
  }

  set limit(l: number) {
    this._limit = l;
  }

  /**
   * Passes a function to be called on undo and redo actions.
   */
  set callback(callbackFunc: Function) {
    this._callback = callbackFunc;
  }

  private execute(
    command: UndoCommand,
    action: keyof UndoCommand
  ): UndoManager {
    if (!command || typeof command[action] !== "function") {
      return this;
    }

    this._isExecuting = true;

    command[action]();

    this._isExecuting = false;

    return this;
  }

  /**
   * Adds a command to the queue.
   * @param command
   */
  public add(command: UndoCommand): UndoManager {
    if (this._isExecuting) {
      return this;
    }

    const commands = this.commands;
    const limit = this._limit;

    // if we are here after having called undo,
    // invalidate items higher in the stack
    commands.splice(this.index + 1, commands.length - 1);
    commands.push(command);

    // if limit is set, remove items from the start
    if (limit && commands.length > limit) {
      commands.splice(0, commands.length - limit);
    }

    // set the current index to the end
    this._index = commands.length - 1;
    if (this._callback) {
      this._callback();
    }
  }

  /**
   * Performs undo: call the undo function at the current index and decrease the index by 1.
   */
  undo(): UndoManager {
    const command = this.commands[this.index];
    if (!command) {
      return this;
    }

    this.execute(command, "undo");
    this._index -= 1;
    if (this._callback) {
      this._callback();
    }

    return this;
  }

  /**
   * Performs redo: call the redo function at the next index and increase the index by 1.
   */
  redo(): UndoManager {
    const command = this.commands[this.index + 1];
    if (!command) {
      return this;
    }

    this.execute(command, "redo");
    this._index += 1;
    if (this._callback) {
      this._callback();
    }

    return this;
  }

  /**
   * Clears the memory, losing all stored states. Reset the index.
   */
  clear(): void {
    const prev_size = this._commands.length;

    this._commands = [];
    this._index = -1;

    if (this._callback && prev_size > 0) {
      this._callback();
    }
  }

  hasUndo(): boolean {
    return this.index !== -1;
  }

  hasRedo(): boolean {
    return this.index < this.commands.length - 1;
  }
}
