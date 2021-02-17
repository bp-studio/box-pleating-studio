
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

	@shrewd get dragging(): boolean {
		return this.flap.design.dragging && this.flap.selected;
	}

	public get distance(): number { return 0; }

	@noCompare // 已經透過 q.contour 來把關
	public get segment(): PolyBool.Segments {
		this.disposeEvent();
		let path: Path = [];
		this.quadrants.forEach(q => path.push(...q.contour));
		return PathUtil.toSegments(path);
	}
}
