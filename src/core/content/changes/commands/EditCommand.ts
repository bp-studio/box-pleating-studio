import { Command } from "./Command";
import { TreeEdge } from "bp/content/context";
import { Disposable } from "bp/class";
import { CommandType } from "bp/content/json";
import type { TreeElement } from "bp/content/context";
import type { IDesignLike } from "bp/content/interface";
import type { JEdge, JNode, JTreeElement, JCommand } from "bp/content/json";

export type EditType = CommandType.add | CommandType.remove;

export interface JEditCommand extends JCommand {
	readonly type: EditType;
	readonly memento: JTreeElement;
}

//////////////////////////////////////////////////////////////////
/**
 * 使用者對樹狀結構進行了編輯的操作。
 */
//////////////////////////////////////////////////////////////////

export class EditCommand extends Command implements JEditCommand {

	public static $add(target: TreeElement): EditCommand {
		return new EditCommand(target.$design, {
			type: CommandType.add,
			tag: target.$tag,
			memento: target.toJSON(),
		});
	}

	public static $remove(target: TreeElement): EditCommand {
		return new EditCommand(target.$design, {
			type: CommandType.remove,
			tag: target.$tag,
			memento: target.toJSON(),
		});
	}

	/** @exports */
	public readonly type: EditType;

	/** @exports */
	public readonly memento: JTreeElement;

	constructor(design: IDesignLike, json: JEditCommand) {
		super(design, json);
		this.type = json.type;
		this.memento = json.memento;
	}

	public $canAddTo(command: Command): boolean {
		return false; // EditCommand 不可能疊加
	}

	public $addTo(command: Command): void {
		// EditCommand 不可能疊加
	}

	public get $isVoid(): boolean {
		return false; // EditCommand 不可能是 void
	}

	private _remove(): void {
		let obj = this._design.$query?.(this.tag);
		// eslint-disable-next-line no-useless-call
		if(obj instanceof Disposable) obj.$dispose.call(obj, [true]);
	}

	private _add(): void {
		let tree = this._design.$tree;
		if(!tree) return;
		if(this.tag.startsWith('e')) {
			let m = this.memento as JEdge;
			let n1 = tree.$getOrAddNode(m.n1), n2 = tree.$getOrAddNode(m.n2);
			tree.$edge.set(n1, n2, new TreeEdge(n1, n2, m.length));
		} else {
			let m = this.memento as JNode;
			tree.$getOrAddNode(m.id).parentId = m.parentId;
		}
	}

	public $undo(): void {
		this.type == CommandType.add ? this._remove() : this._add();
	}

	public $redo(): void {
		this.type == CommandType.add ? this._add() : this._remove();
	}
}
