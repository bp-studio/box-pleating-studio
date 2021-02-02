
@shrewd class RiverHelperBase extends Disposable {

	public readonly flap: Flap;
	protected readonly view: View;
	protected readonly quadrants: readonly QuadrantHelper[];

	constructor(view: View, flap: Flap) {
		super(view);
		this.view = view;
		this.flap = flap;
		this.quadrants = MakePerQuadrant(q => new QuadrantHelper(this, q));
	}

	protected get shouldDispose(): boolean {
		return super.shouldDispose || this.flap.disposed;
	}

	protected onDispose() {
		// @ts-ignore
		delete this.flap;
	}

	public get distance(): number { return 0; }

	@segment("segment") public get segment(): PolyBool.Segments {
		this.disposeEvent();
		let path: Path = [];
		this.quadrants.forEach(q => path.push(...q.contour));
		return PathUtil.toSegments(path);
	}
}
