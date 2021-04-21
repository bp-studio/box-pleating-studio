
@shrewd class VertexView extends LabeledView<Vertex> {

	protected _label: paper.PointText;
	protected _glow: paper.PointText;
	private _dot: paper.Path.Circle;

	// 在新的縮放框架之下物件的繪圖粗細不能隨便改變，所以另開一個物件處理選取的問題
	private _dotSel: paper.Path.Circle;

	// 偵測選取用的圓形區域，比真正繪製的圓大很多
	private _circle: paper.Path.Circle;

	constructor(vertex: Vertex) {
		super(vertex);

		let option = Object.assign({}, Style.$dot, { radius: 4 });
		this.$addItem(Layer.$dot, this._dot = new paper.Path.Circle(option));
		option = Object.assign({}, Style.$dotSelected, { radius: 4 });
		this.$addItem(Layer.$dot, this._dotSel = new paper.Path.Circle(option));
		this.$addItem(Layer.$label, this._glow = new paper.PointText(Style.$glow));
		this.$addItem(Layer.$label, this._label = new paper.PointText(Style.$label));

		this._circle = new paper.Path.Circle({ radius: 0.4 });
	}

	public $contains(point: paper.Point): boolean {
		return this._circle.contains(point) ||
			this._glow.hitTest(point.transform(this._glow.layer.matrix.inverted())) != null;
	}

	protected $render(): void {
		let ds = this._control.$sheet.$displayScale;
		let x = this._control.$location.x, y = this._control.$location.y;
		this._circle.position.set([x, y]);
		this._dot.position.set([x * ds, -y * ds]);
		this._dotSel.position.set([x * ds, -y * ds]);
	}

	protected $renderSelection(selected: boolean) {
		this._dotSel.visible = selected;
	}

	/** 尺度太小的時候調整頂點繪製 */
	@shrewd private _renderDot() {
		let s = 4 * Math.sqrt(this.scale);
		this._dot.copyContent(new paper.Path.Circle({
			position: this._dot.position,
			radius: s
		}));
	}

	protected $renderUnscaled() {
		let x = this._control.$location.x, y = this._control.$location.y;
		let lines = this._control.$node.edges.map(e => {
			let edgeView = this._control.$sheet.$design.edges.get(e)!.$view;
			edgeView.$draw();
			return edgeView.line;
		});
		this._label.content = this._control.$node.name;
		LabelUtil.$setLabel(this._control.$sheet, this._label, this._glow, { x, y }, this._dot, ...lines);
	}
}
