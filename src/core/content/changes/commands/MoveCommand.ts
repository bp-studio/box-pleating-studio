import { Command } from "./Command";
import { Draggable } from "bp/design/class";
import { clone } from "bp/util";
import { CommandType } from "bp/content/json";
import type { JCommand } from "bp/content/json";
import type { Typeless } from "./Command";
import type { IDesignLike } from "bp/content/interface";
import type { IPoint } from "bp/math";

export interface JMoveCommand extends JCommand {
	readonly old: IPoint;
	readonly new: IPoint;
}

//=================================================================
/**
 * 使用者對於某個欄位值進行修改的操作。
 */
//=================================================================

export class MoveCommand extends Command implements JMoveCommand {

	public static $create(target: Draggable, loc: IPoint, relative: boolean = true): MoveCommand {
		if(relative) {
			loc.x += target.$location.x;
			loc.y += target.$location.y;
		}
		let command = new MoveCommand(target.$design, {
			tag: target.$tag,
			old: clone(target.$location),
			new: loc,
		});
		return command;
	}

	/** @exports */
	public readonly type = CommandType.move;

	/** @exports */
	public old: IPoint;

	/** @exports */
	public new: IPoint;

	constructor(design: IDesignLike, json: Typeless<JMoveCommand>) {
		super(design, json);
		this.old = json.old;
		this.new = json.new;
	}

	public $canAddTo(command: Command): boolean {
		return command instanceof MoveCommand && command.tag == this.tag &&
			// 對方必須接續在自己之後
			command.new.x == this.old.x && command.new.y == this.old.y &&
			// 鍵盤操作的情況必須沿著大致同一方向運行；利用這個條件便可以解決回到原點的問題
			(this._design.$dragging || this._dx * command._dx >= 0 && this._dy * command._dy >= 0);
	}

	public $addTo(command: Command): void {
		Draggable.$assign((command as MoveCommand).new, this.new);
	}

	private get _dx(): number { return this.new.x - this.old.x; }
	private get _dy(): number { return this.new.y - this.old.y; }

	public get $isVoid(): boolean {
		return this.old.x == this.new.x && this.old.y == this.new.y;
	}

	public $undo(): void {
		let obj = this._design.$query?.(this.tag);
		if(obj instanceof Draggable) Draggable.$assign(obj.$location, this.old);
	}

	public $redo(): void {
		let obj = this._design.$query?.(this.tag);
		if(obj instanceof Draggable) Draggable.$assign(obj.$location, this.new);
	}
}
