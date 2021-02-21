
interface JAddCommand extends JCommand {
	memento: JEdge;
}

//////////////////////////////////////////////////////////////////
/**
 * 使用者新增了某種元件的操作。
 *
 * 目前實際上真的會被主動新增的東西只有一種，就是邊；其餘的都是被動的。
 */
//////////////////////////////////////////////////////////////////

class AddCommand extends Command implements JAddCommand {

	public static create(target: TreeEdge) {
		let command = new AddCommand(target.design, {
			tag: target.tag,
			memento: target.toJSON()
		});
		target.design.history.queue(command);
	}

	public readonly type = CommandType.add;
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
		let target = this._design.query(this.tag)!;
		if(target instanceof TreeEdge) target.delete();
	}

	public redo() {
		this._design.tree.addEdge(this.memento.n1, this.memento.n2, this.memento.length);
	}
}
