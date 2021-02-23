
interface JRemoveCommand extends JCommand {
	memento: JEdge;
}

//////////////////////////////////////////////////////////////////
/**
 * 使用者移除了某種元件的操作。
 *
 * 目前實際上真的會被主動移除的東西只有一種，就是點；其餘的都是被動的。
 */
//////////////////////////////////////////////////////////////////

class RemoveCommand extends Command implements JRemoveCommand {

	public static create(target: TreeNode) {
		let command = new RemoveCommand(target.design, {
			tag: target.tag,
			memento: target.edges[0].toJSON()
		});
		target.dispose(true);
		target.design.history.queue(command);
	}

	public readonly type = CommandType.remove;
	public readonly memento: JEdge;

	constructor(design: Design, json: Typeless<JAddCommand>) {
		super(design, json);
		this.memento = json.memento;
	}

	public canAddTo(command: Command): boolean {
		return false; // AddCommand 不可能疊加
	}

	public addTo(command: Command) { }

	public undo() {
		this._design.tree.addEdge(this.memento.n1, this.memento.n2, this.memento.length);
	}

	public redo() {
		let target = this._design.query(this.tag)!;
		if(target instanceof TreeNode) target.dispose();
	}
}
