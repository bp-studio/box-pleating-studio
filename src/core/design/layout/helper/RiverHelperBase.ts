
//////////////////////////////////////////////////////////////////
/**
 * {@link RiverHelperBase} 是輔助輪廓管理的類別。
 */
//////////////////////////////////////////////////////////////////

@shrewd class RiverHelperBase extends Disposable {

	public readonly $flap: Flap;
	protected readonly _view: View;
	protected readonly _quadrants: readonly QuadrantHelper[];

	constructor(view: View, flap: Flap) {
		super(view);
		this._view = view;
		this.$flap = flap;
		this._quadrants = makePerQuadrant(q => new QuadrantHelper(this, q));
	}

	protected get $shouldDispose(): boolean {
		return super.$shouldDispose || this.$flap.$disposed;
	}

	public get $distance(): number {
		return 0;
	}

	@noCompare // 已經透過 q.contour 來把關
	public get $shape(): PolyBool.Shape {
		this.$disposeEvent();
		let path: Path = [];
		this._quadrants.forEach(q => path.push(...q.$contour));
		return PathUtil.$toSegments(path);
	}
}
