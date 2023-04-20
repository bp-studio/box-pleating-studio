import { CommandType } from "shared/json/enum";
import { Command } from "./command";

import type { Vertex } from "client/project/components/tree/vertex";
import type { Project } from "client/project/project";
import type { JCommand } from "shared/json/history";
import type { JEdge, JNode, JTreeElement } from "shared/json/tree";
import type { Edge } from "client/project/components/tree/edge";

type TreeElement = Vertex | Edge;

export type EditType = CommandType.add | CommandType.remove;

export interface JEditCommand extends JCommand {
	readonly type: EditType;
	readonly memento: JTreeElement;
}

//=================================================================
/**
 * {@link EditCommand} is when the user changes the structure of the tree.
 */
//=================================================================

export class EditCommand extends Command implements JEditCommand {

	public static $add(target: TreeElement): EditCommand {
		return new EditCommand(target.$project, {
			type: CommandType.add,
			tag: target.$tag,
			memento: target.toJSON(),
		});
	}

	public static $remove(target: TreeElement): EditCommand {
		return new EditCommand(target.$project, {
			type: CommandType.remove,
			tag: target.$tag,
			memento: target.toJSON(),
		});
	}

	/** @exports */
	public readonly type: EditType;

	/** @exports */
	public readonly memento: JTreeElement;

	constructor(project: Project, json: JEditCommand) {
		super(project, json);
		this.type = json.type;
		this.memento = json.memento;
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

	private _remove(): void {
		const obj = this._project.design.$query(this.tag);
		// eslint-disable-next-line no-useless-call
		// if(obj instanceof Disposable) obj.$dispose.call(obj, [true]);
	}

	private _add(): void {
		const tree = this._project.design.tree;
		// if(this.tag.startsWith("e")) {
		// 	const m = this.memento as JEdge;


		// 	const n1 = tree.$getOrAddNode(m.n1), n2 = tree.$getOrAddNode(m.n2);
		// 	tree.$edge.set(n1, n2, new TreeEdge(n1, n2, m.length));
		// } else {
		// 	const m = this.memento as JNode;
		// 	tree.$getOrAddNode(m.id).parentId = m.parentId;
		// }
	}

	public $undo(): void {
		this.type == CommandType.add ? this._remove() : this._add();
	}

	public $redo(): void {
		this.type == CommandType.add ? this._add() : this._remove();
	}
}
