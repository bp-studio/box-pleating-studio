
type TreeElement = TreeNode | TreeEdge;
type JTreeElement = JNode | JEdge;

interface JAddCommand extends JCommand {
	memento: JTreeElement;
}

//////////////////////////////////////////////////////////////////
/**
 * 使用者新增了某種元件的操作。
 *
 * 目前實際上真的會被主動新增的東西只有一種，就是邊；其餘的都是被動的。
 */
//////////////////////////////////////////////////////////////////

class AddCommand extends Command implements JAddCommand {

	public static create<T extends TreeElement>(target: T): T {
		let command = new AddCommand(target.design, {
			tag: target.tag,
			memento: target.toJSON()
		});
		target.design.history.queue(command);
		return target;
	}

	public readonly type = CommandType.add;
	public readonly memento: JTreeElement;

	constructor(design: Design, json: Typeless<JAddCommand>) {
		super(design, json);
		this.memento = json.memento;
	}

	public canAddTo(command: Command): boolean {
		return false; // AddCommand 不可能疊加
	}

	public addTo(command: Command) { }

	public undo() {
		let target = this._design.query(this.tag)!;
		if(target instanceof TreeEdge) target.design.tree.edge.delete(target.n1, target.n2);
		target.dispose(true);
	}

	public redo() {
		let tree = this._design.tree;
		if(this.tag.startsWith('e')) {
			let m = this.memento as JEdge;
			let n1 = tree.getOrAddNode(m.n1), n2 = tree.getOrAddNode(m.n2);
			tree.edge.set(n1, n2, new TreeEdge(n1, n2, m.length));
		} else {
			let m = this.memento as JNode;
			tree.getOrAddNode(m.id);
		}
	}
}
