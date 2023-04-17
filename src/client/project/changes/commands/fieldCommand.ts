import { Command } from "./command";
import { CommandType } from "shared/json/enum";

import type { Project } from "client/project/project";
import type { Typeless } from "./command";
import type { ITagObject } from "client/shared/interface";
import type { JCommand } from "shared/json/history";


export interface JFieldCommand extends JCommand {
	readonly prop: string;
	readonly old: unknown;
	readonly new: unknown;
}

//=================================================================
/**
 * {@link FieldCommand} is when the user edits the value of a field.
 */
//=================================================================

export class FieldCommand extends Command implements JFieldCommand {

	public static create(
		target: ITagObject, prop: string, oldValue: unknown, newValue: unknown
	): FieldCommand {
		return new FieldCommand(target.$project, {
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

	constructor(project: Project, json: Typeless<JFieldCommand>) {
		super(project, json);
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
		const target = this._project.design.$query(this.tag);
		if(target) Reflect.set(target, this.prop, this.old);
	}

	public $redo(): void {
		const target = this._project.design.$query(this.tag);
		if(target) Reflect.set(target, this.prop, this.new);
	}
}
