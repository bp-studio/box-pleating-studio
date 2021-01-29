
@shrewd class FlapView extends LabeledView<Flap> {

	protected readonly _label: paper.PointText;
	public readonly hinge: paper.Path;
	private readonly _shade: paper.Path;
	private readonly _dots: PerQuadrant<paper.Path.Circle>;
	private readonly _circle: paper.Path;
	private readonly _outerRidges: paper.CompoundPath;
	private readonly _innerRidges: paper.CompoundPath;
	private readonly _glow: paper.PointText;

	constructor(flap: Flap) {
		super(flap);

		this.$addItem(Layer.shade, this._shade = new paper.Path.Rectangle(Style.shade));
		this.$addItem(Layer.hinge, this.hinge = new paper.Path.Rectangle(Style.hinge));
		this.$addItem(Layer.shade, this._circle = new paper.Path(Style.circle));

		this._dots = MakePerQuadrant(i => {
			let d = new paper.Path.Circle(Style.dot);
			this.$addItem(Layer.dot, d);
			return d;
		});

		this.$addItem(Layer.ridge, this._innerRidges = new paper.CompoundPath(Style.ridge));
		this.$addItem(Layer.ridge, this._outerRidges = new paper.CompoundPath(Style.ridge));
		this.$addItem(Layer.label, this._glow = new paper.PointText(Style.glow));
		this.$addItem(Layer.label, this._label = new paper.PointText(Style.label));
	}

	public contains(point: paper.Point) {
		return this.control.sheet.view.contains(point) &&
			(this.hinge.contains(point) || this.hinge.hitTest(point) != null);
	}

	@shrewd public get circle() {
		return this.makeRectangle(0);
	}

	/** 產生（附加額外距離 d）的矩形，預設會帶有圓角 */
	public makeRectangle(d: number) {
		let p = this.control.points, r = this.control.node.radius + d;
		return new paper.Path.Rectangle({
			from: [p[2].x - r, p[2].y - r],
			to: [p[0].x + r, p[0].y + r],
			radius: r
		});;
	}

	public makeSegments(d: number): PolyBool.Segments {
		let path: Path = [];
		this.control.quadrants.forEach(q => path.push(...q.makeContour(d)));
		return PathUtil.toSegments(path);
	}

	@segment("hinge") public get hingeSegments() {
		this.disposeEvent();
		return this.makeSegments(0);
	}

	/** 這個獨立出來以提供 RiverView 的相依 */
	@shrewd public renderHinge() {
		if(this.control.disposed) return;
		this._circle.visible = this.$studio?.$display.settings.showHinge ?? false;
		let paths = PaperUtil.fromSegments(this.hingeSegments);
		this.hinge.removeSegments();
		if(paths.length) this.hinge.add(...paths[0].segments); // 這邊頂多只有一個
		else debugger;
	}

	protected render() {
		let ds = this.control.sheet.displayScale;
		let w = this.control.width, h = this.control.height;

		this._circle.copyContent(this.circle);

		this.renderHinge();

		// dots
		let fix = (p: paper.Point) => [p.x * ds, -p.y * ds];
		let p = MakePerQuadrant(i => {
			let pt = this.control.points[i].toPaper();
			this._dots[i].position.set(fix(pt));
			return pt;
		});
		this._dots[2].visible = w > 0 || h > 0;
		this._dots[1].visible = this._dots[3].visible = w > 0 && h > 0;

		// inner ridges
		this._innerRidges.removeChildren();
		this._innerRidges.moveTo(p[3]);
		p.forEach(p => this._innerRidges.lineTo(p));
		this._innerRidges.visible = w > 0 || h > 0;

		// outer ridges
		this._outerRidges.removeChildren();
		this.control.quadrants.forEach((q, i) => {
			if(q.pattern == null) PaperUtil.addLine(this._outerRidges, p[i], q.corner);
		});

		this._label.content = this.control.node.name;
		LabelUtil.setLabel(this.control.sheet, this._label, this._glow, this.control.dragSelectAnchor, this._dots[0]);

		this._shade.copyContent(this.hinge);
	}

	protected renderSelection(selected: boolean) {
		this._shade.visible = selected;
	}
}
