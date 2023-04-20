import { Command } from "./command";
import { Draggable } from "client/base/draggable";
import { CommandType } from "shared/json/enum";
import { clone } from "shared/utils/clone";

import type { Project } from "client/project/project";
import type { Typeless } from "./command";
import type { JCommand } from "shared/json/history";

export interface JMoveCommand extends JCommand {
	readonly old: IPoint;
	readonly new: IPoint;
}

//=================================================================
/**
 * {@link MoveCommand} is when the user moves an object.
 */
//=================================================================

export class MoveCommand extends Command implements JMoveCommand {

	public static $create(target: Draggable, loc: IPoint): MoveCommand {
		return new MoveCommand(target.$project, {
			tag: target.$tag,
			old: clone(target.$location),
			new: loc,
		});
	}

	/** @exports */
	public readonly type = CommandType.move;

	/** @exports */
	public old: IPoint;

	/** @exports */
	public new: IPoint;

	constructor(project: Project, json: Typeless<JMoveCommand>) {
		super(project, json);
		this.old = json.old;
		this.new = json.new;
	}

	public $canAddTo(command: Command): boolean {
		return command instanceof MoveCommand && command.tag == this.tag &&
			// Candidate command must be immediately after self
			command.new.x == this.old.x && command.new.y == this.old.y &&
			// In case of keyboard moving, it must roughly towards the same direction.
			// This solves the issue of returning to the origin.
			(this._project.$isDragging || this._dx * command._dx >= 0 && this._dy * command._dy >= 0);
	}

	public $addTo(command: Command): void {
		(command as MoveCommand).new = this.new;
	}

	private get _dx(): number { return this.new.x - this.old.x; }
	private get _dy(): number { return this.new.y - this.old.y; }

	public get $isVoid(): boolean {
		return this.old.x == this.new.x && this.old.y == this.new.y;
	}

	public $undo(): void {
		const obj = this._project.design.$query(this.tag);
		if(obj instanceof Draggable) obj.$assign(this.old);
	}

	public $redo(): void {
		const obj = this._project.design.$query(this.tag);
		if(obj instanceof Draggable) obj.$assign(this.new);
	}
}
