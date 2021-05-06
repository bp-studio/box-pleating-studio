
@shrewd class RiverHelperBase extends Disposable {

	public readonly $flap: Flap;
	protected readonly _view: View;
	protected readonly _quadrants: readonly QuadrantHelper[];

	constructor(view: View, flap: Flap) {
		super(view);
		this._view = view;
		this.$flap = flap;
		this._quadrants = MakePerQuadrant(q => new QuadrantHelper(this, q));
	}

	protected get $shouldDispose(): boolean {
		return super.$shouldDispose || this.$flap.$disposed;
	}

	protected $onDispose() {
		// @ts-ignore
		delete this.$flap;
	}

	public get $distance(): number { return 0; }

	@noCompare // 已經透過 q.contour 來把關
	public get $shape(): PolyBool.Shape {
		this.$disposeEvent();
		let path: Path = [];
		this._quadrants.forEach(q => path.push(...q.$contour));
		return PathUtil.$toSegments(path);
	}
}
