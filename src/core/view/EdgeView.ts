
@shrewd class EdgeView extends LabeledView<Edge> {

	public line: paper.Path;

	protected _label: paper.PointText;
	protected _glow: paper.PointText;

	/** 加粗的直線空間，方便判定選取動作 */
	private _lineRegion: paper.Path;

	constructor(edge: Edge) {
		super(edge);

		this.$addItem(Layer.$ridge, this.line = new paper.Path.Line(Style.$edge));
		this.$addItem(Layer.$label, this._glow = new paper.PointText(Style.$glow));
		this.$addItem(Layer.$label, this._label = new paper.PointText(Style.$label));

		this._lineRegion = new paper.Path.Line({ strokeWidth: 15 });
	}

	public $contains(point: paper.Point) {
		let vm = this._control.$design.$viewManager;
		return (this._lineRegion.hitTest(point) != null ||
			this._glow.hitTest(point.transform(this._glow.layer.matrix.inverted())) != null) &&
			!vm.$contains(this._control.$v1, point) &&
			!vm.$contains(this._control.$v2, point);
	}

	protected $render() {
		let l1 = this._control.$v1.$location, l2 = this._control.$v2.$location;
		this._lineRegion.segments[0].point.set([l1.x, l1.y]);
		this._lineRegion.segments[1].point.set([l2.x, l2.y]);
		this.line.copyContent(this._lineRegion);
	}

	protected $renderSelection(selected: boolean) {
		let color = selected ? PaperUtil.$Red() : PaperUtil.$Black();
		this._label.fillColor = this._label.strokeColor = this.line.strokeColor = color;
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		this.line.strokeWidth = selected ? 3 : 2;
	}

	protected $renderUnscaled() {
		this.$draw();
		let l1 = this._control.$v1.$location, l2 = this._control.$v2.$location;
		let center: IPoint = { x: (l1.x + l2.x) / 2, y: (l1.y + l2.y) / 2 };
		this._label.content = this._control.length.toString();
		LabelUtil.$setLabel(this._control.$sheet, this._label, this._glow, center, this.line);
	}
}
