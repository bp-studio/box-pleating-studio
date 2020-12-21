
@shrewd class EdgeView extends ControlView<Edge> {

	public line: paper.Path;

	/** 加粗的直線空間，方便判定選取動作 */
	private _lineRegion: paper.Path;
	private _label: paper.PointText;
	private _glow: paper.PointText;

	constructor(edge: Edge) {
		super(edge);
		
		this.$addItem(Layer.ridge, this.line = new paper.Path.Line(Style.edge));
		this.$addItem(Layer.label, this._glow = new paper.PointText(Style.glow));
		this.$addItem(Layer.label, this._label = new paper.PointText(Style.label));

		this._lineRegion = new paper.Path.Line({ strokeWidth: 15 });
	}

	public contains(point: paper.Point) {
		return (this._lineRegion.hitTest(point) != null ||
			this._glow.hitTest(point.transform(this._glow.layer.matrix.inverted())) != null)
			&& !this.control.v1.view.contains(point)
			&& !this.control.v2.view.contains(point);
	}

	protected render() {
		let l1 = this.control.v1.location, l2 = this.control.v2.location;
		let center: IPoint = { x: (l1.x + l2.x) / 2, y: (l1.y + l2.y) / 2 };

		this._lineRegion.segments[0].point.set([l1.x, l1.y]);
		this._lineRegion.segments[1].point.set([l2.x, l2.y]);
		this.line.copyContent(this._lineRegion);

		this._label.content = this.control.length.toString();
		LabelUtil.setLabel(this.control.sheet, this._label, this._glow, center, this.line);
	}

	protected renderSelection(selected: boolean) {
		let color = selected ? PaperUtil.Red : PaperUtil.Black;
		this._label.fillColor = this._label.strokeColor = this.line.strokeColor = color;
		this.line.strokeWidth = selected ? 3 : 2;
	}
}