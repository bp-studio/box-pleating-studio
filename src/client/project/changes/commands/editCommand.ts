import { CommandType } from "shared/json/enum";
import { Command } from "./command";

import type { Project } from "client/project/project";
import type { JCommand } from "shared/json/history";
import type { JEdit } from "shared/json/tree";

export interface JEditCommand extends JCommand {
	readonly old: number;
	readonly new: number;
	readonly edits: JEdit[];
}

//=================================================================
/**
 * {@link EditCommand} is when the user changes the structure of the tree.
 */
//=================================================================

export class EditCommand extends Command implements JEditCommand {

	public static $create(proj: Project, edits: JEdit[], oldRoot: number, newRoot: number): EditCommand {
		return new EditCommand(proj, {
			type: CommandType.edit,
			tag: "tree",
			edits,
			old: oldRoot,
			new: newRoot,
		});
	}

	/** @exports */
	public readonly type = CommandType.edit;

	/** @exports */
	public readonly edits: JEdit[];

	public readonly old: number;
	public readonly new: number;

	constructor(project: Project, json: JEditCommand) {
		super(project, json);
		this.edits = json.edits;
		this.old = json.old;
		this.new = json.new;
	}

	public override $canAddTo(command: Command): boolean {
		return false; // EditCommand cannot be combined
	}

	public override $addTo(command: Command): void {
		// EditCommand cannot be combined
	}

	public override get $isVoid(): boolean {
		return false; // EditCommand cannot be void
	}

	public $undo(): Promise<void> {
		const edits = this.edits.map<JEdit>(e => [!e[0], e[1]]).reverse();
		const layout = this._project.design.$prototype.layout;
		return this._project.$core.tree.edit(edits, this.old, layout.flaps, layout.stretches);
	}

	public $redo(): Promise<void> {
		const layout = this._project.design.$prototype.layout;
		return this._project.$core.tree.edit(this.edits, this.new, layout.flaps, layout.stretches);
	}
}
