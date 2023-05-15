import { CommandType } from "shared/json/enum";
import { Command } from "./command";

import type { Project } from "client/project/project";
import type { JCommand } from "shared/json/history";
import type { JEdit } from "shared/json/tree";

export interface JEditCommand extends JCommand {
	readonly edits: JEdit[];
}

//=================================================================
/**
 * {@link EditCommand} is when the user changes the structure of the tree.
 */
//=================================================================

export class EditCommand extends Command implements JEditCommand {

	public static $create(proj: Project, edits: JEdit[]): EditCommand {
		return new EditCommand(proj, { type: CommandType.edit, tag: "tree", edits });
	}

	/** @exports */
	public readonly type = CommandType.edit;

	/** @exports */
	public readonly edits: JEdit[];

	constructor(project: Project, json: JEditCommand) {
		super(project, json);
		this.edits = json.edits;
	}

	public $canAddTo(command: Command): boolean {
		return false; // EditCommand cannot be combined
	}

	public $addTo(command: Command): void {
		// EditCommand cannot be combined
	}

	public get $isVoid(): boolean {
		return false; // EditCommand cannot be void
	}

	public $undo(): Promise<void> {
		const edits = this.edits.map(e => [!e[0], e[1]]).reverse();
		const layout = this._project.design.$prototype.layout;
		return this._project.$core.tree.edit(edits as JEdit[], layout.flaps, layout.stretches);
	}

	public $redo(): Promise<void> {
		const layout = this._project.design.$prototype.layout;
		return this._project.$core.tree.edit(this.edits, layout.flaps, layout.stretches);
	}
}
