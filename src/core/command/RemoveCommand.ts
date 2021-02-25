
interface JRemoveCommand extends JCommand {
	memento: JTreeElement;
}

//////////////////////////////////////////////////////////////////
/**
 * 使用者移除了某種元件的操作。
 *
 * 目前實際上真的會被主動移除的東西只有一種，就是點；其餘的都是被動的。
 */
//////////////////////////////////////////////////////////////////

class RemoveCommand extends Command implements JRemoveCommand {

	public static create(target: TreeElement) {
		let command = new RemoveCommand(target.design, {
			tag: target.tag,
			memento: target.toJSON()
		});
		if(target instanceof TreeEdge) target.design.tree.edge.delete(target.n1, target.n2);
		target.dispose(true);
		target.design.history.queue(command);
	}

	public readonly type = CommandType.remove;
	public readonly memento: JTreeElement;

	constructor(design: Design, json: Typeless<JRemoveCommand>) {
		super(design, json);
		this.memento = json.memento;
	}

	public canAddTo(command: Command): boolean {
		return false; // AddCommand 不可能疊加
	}

	public addTo(command: Command) { }

	public undo() {
		let tree = this._design.tree;
		if(this.tag.startsWith("n")) {
			let m = this.memento as JNode;
			tree.getOrAddNode(m.id).parentId = m.parentId;
		} else {
			let m = this.memento as JEdge;
			let n1 = tree.getOrAddNode(m.n1), n2 = tree.getOrAddNode(m.n2);
			tree.edge.set(n1, n2, new TreeEdge(n1, n2, m.length));
		}
	}

	public redo() {
		let target = this._design.query(this.tag)!;
		if(target instanceof TreeNode) target.dispose(true);
		if(target instanceof TreeEdge) {
			this._design.tree.edge.delete(target.n1, target.n2);
			target.dispose();
		}
	}
}
