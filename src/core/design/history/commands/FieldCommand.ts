import { Command } from "./Command";
import { CommandType } from "bp/content/json";
import type { JCommand } from "bp/content/json";
import type { Typeless } from "./Command";
import type { ITagObject } from "..";
import type { Design } from "bp/design";

export interface JFieldCommand extends JCommand {
	readonly prop: string;
	readonly old: unknown;
	readonly new: unknown;
}

//////////////////////////////////////////////////////////////////
/**
 * 使用者對於某個欄位值進行修改的操作。
 */
//////////////////////////////////////////////////////////////////

export class FieldCommand extends Command implements JFieldCommand {

	public static create(
		target: ITagObject, prop: string, oldValue: unknown, newValue: unknown
	): FieldCommand {
		return new FieldCommand(target.$design, {
			tag: target.$tag,
			prop,
			old: oldValue,
			new: newValue,
		});
	}

	/** @exports */
	public readonly type = CommandType.field;

	/** @exports */
	public readonly prop: string;

	/** @exports */
	public old: unknown;

	/** @exports */
	public new: unknown;

	constructor(design: Design, json: Typeless<JFieldCommand>) {
		super(design, json);
		this.prop = json.prop;
		this.old = json.old;
		this.new = json.new;
	}

	public $canAddTo(command: Command): boolean {
		return command instanceof FieldCommand &&
			command.tag == this.tag &&
			command.new == this.old;
	}

	public $addTo(command: Command): void {
		(command as FieldCommand).new = this.new;
	}

	public get $isVoid(): boolean {
		return this.old == this.new;
	}

	public $undo(): void {
		let target = this._design.$query(this.tag)!;
		Reflect.set(target, this.prop, this.old);
	}

	public $redo(): void {
		let target = this._design.$query(this.tag)!;
		Reflect.set(target, this.prop, this.new);
	}
}
