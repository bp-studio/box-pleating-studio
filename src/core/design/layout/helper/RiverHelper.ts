
//////////////////////////////////////////////////////////////////
/**
 * {@link RiverHelper} 是負責監視針對特定的 {@link Flap} 在對應於特定 {@link River}
 * 的距離之下產生的輪廓的物件。
 *
 * 由於這些東西只要 Flap 本身以及相關的 Pattern 沒有發生變更就不需要重新計算，
 * 特別利用一個反應式物件來監視，以增進效能。
 */
//////////////////////////////////////////////////////////////////

@shrewd class RiverHelper extends RiverHelperBase {

	private readonly _node: TreeNode;
	private readonly _key: string;
	protected readonly _view: RiverView;

	constructor(view: RiverView, ids: number[]) {
		super(view, view.$design.$flaps.$byId.get(ids[0])!);
		this._node = view.$design.$tree.$node.get(ids[1])!;
		this._key = ids[0] + "," + ids[1];
	}

	protected get $shouldDispose(): boolean {
		return super.$shouldDispose || !this._view.$info.components.some(c => c == this._key);
	}

	protected $onDispose(): void {
		super.$onDispose();
		// @ts-ignore
		delete this._node;
	}

	@shrewd public get $distance(): number {
		this.$disposeEvent();
		let { $design, $info } = this._view, flap = this.$flap;
		let dis = $design.$tree.$dist(flap.node, this._node);
		return dis - flap.radius + $info.length;
	}

	//@noCompare // segments 和 overridden 都有把關
	@shrewd({
		comparer(ov: PolyBool.Shape, nv: PolyBool.Shape, member) {
			member.ov = ov;
			return false;
		},
	})
	public get $contour(): PolyBool.Shape {
		this.$disposeEvent();
		let seg = this.$shape;
		for(let q of this._quadrants) {
			if(q.$overridden) seg = PolyBool.difference(seg, q.$overridden);
		}
		return seg;
	}
}
