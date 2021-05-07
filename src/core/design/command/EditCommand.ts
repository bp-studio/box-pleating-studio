
type TreeElement = TreeNode | TreeEdge;
type JTreeElement = JNode | JEdge;
type EditType = CommandType.add | CommandType.remove;

interface JEditCommand extends JCommand {
	readonly type: EditType;
	readonly memento: JTreeElement;
}

//////////////////////////////////////////////////////////////////
/**
 * 使用者對樹狀結構進行了編輯的操作。
 */
//////////////////////////////////////////////////////////////////

class EditCommand extends Command implements JEditCommand {

	public static $add<T extends TreeElement>(target: T): T;
	public static $add(target: TreeElement): TreeElement {
		let command = new EditCommand(target.$design, {
			type: CommandType.add,
			tag: target.$tag,
			memento: target.toJSON()
		});

		if(target instanceof TreeNode) {
			target.$tree.$node.set(target.id, target);
		} else {
			target.tree.$edge.set(target.n1, target.n2, target);
		}

		target.$design.$history.$queue(command);
		return target;
	}

	public static $remove(target: TreeElement) {
		let command = new EditCommand(target.$design, {
			type: CommandType.remove,
			tag: target.$tag,
			memento: target.toJSON()
		});
		target.$dispose(true);
		target.$design.$history.$queue(command);
	}

	/** @exports */
	public readonly type: EditType;

	/** @exports */
	public readonly memento: JTreeElement;

	constructor(design: Design, json: JEditCommand) {
		super(design, json);
		this.type = json.type;
		this.memento = json.memento;
	}

	public $canAddTo(command: Command): boolean {
		return false; // EditCommand 不可能疊加
	}

	public $addTo(command: Command) {
		// EditCommand 不可能疊加
	}

	public get $isVoid(): boolean {
		return false; // EditCommand 不可能是 void
	}

	private _remove() {
		let obj = this._design.$query(this.tag);
		// eslint-disable-next-line no-useless-call
		if(obj instanceof Disposable) obj.$dispose.call(obj, [true]);
	}

	private _add() {
		let tree = this._design.$tree;
		if(this.tag.startsWith('e')) {
			let m = this.memento as JEdge;
			let n1 = tree.$getOrAddNode(m.n1), n2 = tree.$getOrAddNode(m.n2);
			tree.$edge.set(n1, n2, new TreeEdge(n1, n2, m.length));
		} else {
			let m = this.memento as JNode;
			tree.$getOrAddNode(m.id).$parentId = m.parentId;
		}
	}

	public $undo() {
		this.type == CommandType.add ? this._remove() : this._add();
	}

	public $redo() {
		this.type == CommandType.add ? this._add() : this._remove();
	}
}
