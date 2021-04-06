
//////////////////////////////////////////////////////////////////
/**
 * `RiverHelper` 是負責監視針對特定的 `Flap` 在對應於特定 `River`
 * 的距離之下產生的輪廓的物件。
 *
 * 由於這些東西只要 Flap 本身以及相關的 Pattern 沒有發生變更就不需要重新計算，
 * 特別利用一個反應式物件來監視，以增進效能。
 */
//////////////////////////////////////////////////////////////////

@shrewd class RiverHelper extends RiverHelperBase {

	private readonly node: TreeNode;
	private readonly key: string;
	protected readonly view: RiverView;

	constructor(view: RiverView, ids: number[]) {
		super(view, view.design.flaps.byId.get(ids[0])!);
		this.node = view.design.tree.node.get(ids[1])!;
		this.key = ids[0] + "," + ids[1];
	}

	protected get shouldDispose(): boolean {
		return super.shouldDispose || !this.view.info.components.some(c => c == this.key);
	}

	protected onDispose() {
		super.onDispose();
		// @ts-ignore
		delete this.node;
	}

	@shrewd public get distance(): number {
		this.disposeEvent();
		let { design, info } = this.view, flap = this.flap;
		let dis = design.tree.dist(flap.node, this.node);
		return dis - flap.radius + info.length;
	}

	//@noCompare // segments 和 overridden 都有把關
	@shrewd({
		comparer(ov: PolyBool.Segments, nv: PolyBool.Segments, member) {
			(member as any).ov = ov;
			return false;
		}
	})
	public get contour(): PolyBool.Segments {
		this.disposeEvent();
		let seg = this.segment;
		for(let q of this.quadrants) {
			if(q.overridden) seg = PolyBool.difference(seg, q.overridden);
		}
		return seg;
	}
}
