
//////////////////////////////////////////////////////////////////
/**
 * `RiverComponent` 是負責監視針對特定的 `Flap` 在對應於特定 `River`
 * 的距離之下產生的輪廓的物件。
 *
 * 由於這些東西只要 Flap 本身以及相關的 Pattern 沒有發生變更就不需要重新計算，
 * 特別利用一個反應式物件來監視，以增進效能。
 */
//////////////////////////////////////////////////////////////////

@shrewd class RiverComponent extends Disposable {

	public readonly flap: Flap;
	private node: TreeNode;

	constructor(private view: RiverView, private key: string) {
		super(view);
		let [f, n] = key.split(',').map(v => Number(v));
		this.flap = view.design.flapsById.get(f)!;
		this.node = view.design.tree.node.get(n)!;
	}

	protected get shouldDispose(): boolean {
		return super.shouldDispose || this.flap.disposed ||
			!this.view.info.components.some(c => c == this.key);
	}

	protected onDispose() {
		let self = this as any;
		delete self.flap;
		delete self.node;
	}

	@shrewd private get distance(): number {
		this.disposeEvent();
		let { design, info } = this.view, flap = this.flap;
		let dis = design.tree.dist(flap.node, this.node);
		return dis - flap.radius + info.length;
	}

	@segment("segment") public get segment(): PolyBool.Segments {
		this.disposeEvent();
		this.flap.view.draw();
		return this.flap.view.makeSegments(this.distance);
	}

	private overridden(q: number) {
		this.disposeEvent();
		return this.flap.quadrants[q].getOverriddenSegments(this.distance);
	}

	@segment("q0") public get q0() { return this.overridden(0); }
	@segment("q1") public get q1() { return this.overridden(1); }
	@segment("q2") public get q2() { return this.overridden(2); }
	@segment("q3") public get q3() { return this.overridden(3); }

	@segment("contour") public get contour(): PolyBool.Segments {
		this.disposeEvent();
		this.flap.view.draw();
		let seg = this.segment;
		for(let q of [this.q0, this.q1, this.q2, this.q3]) {
			seg = PolyBool.difference(seg, q);
		}
		return seg;
	}
}
