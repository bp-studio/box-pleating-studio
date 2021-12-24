import { LabeledView } from "./class";
import { Layer, Style, shrewdStatic } from "bp/global";
import type { EdgeView } from "./EdgeView";
import type { IPoint } from "bp/math";
import type { Vertex } from "bp/design";

//////////////////////////////////////////////////////////////////
/**
 * {@link VertexView} 是對應於 {@link Vertex} 的 {@link LabeledView}。
 */
//////////////////////////////////////////////////////////////////

@shrewd export class VertexView extends LabeledView<Vertex> {

	private static readonly _DOT_SIZE = 4;

	private readonly _dot: paper.Path.Circle;

	// 在新的縮放框架之下物件的繪圖粗細不能隨便改變，所以另開一個物件處理選取的問題
	private readonly _dotSel: paper.Path.Circle;

	// 偵測選取用的圓形區域，比真正繪製的圓大很多
	private readonly _circle: paper.Path.Circle;

	constructor(vertex: Vertex) {
		super(vertex);

		let option = Object.assign({}, Style.$dot, { radius: VertexView._DOT_SIZE });
		this.$addItem(Layer.$dot, this._dot = new paper.Path.Circle(option));
		option = Object.assign({}, Style.$dotSelected, { radius: VertexView._DOT_SIZE });
		this.$addItem(Layer.$dot, this._dotSel = new paper.Path.Circle(option));

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

	protected $renderSelection(selected: boolean): void {
		this._dotSel.visible = selected;
	}

	/** 尺度太小的時候調整頂點繪製 */
	@shrewdStatic private _renderDot(): void {
		let s = VertexView._DOT_SIZE * Math.sqrt(this._drawScale);
		this._dot.copyContent(new paper.Path.Circle({
			position: this._dot.position,
			radius: s,
		}));
	}

	protected $renderUnscaled(): void {
		this._label.content = this._control.$node.name;
	}

	protected get _labelLocation(): IPoint {
		return this._control.$dragSelectAnchor;
	}

	protected get _labelAvoid(): paper.Path[] {
		let design = this._control.$sheet.$design;
		let vm = design.$viewManager;
		let lines = this._control.$node.edges.map(e => {
			let edge = design.$edges.get(e)!;
			let edgeView = vm.$get(edge) as EdgeView;
			edgeView.$draw();
			return edgeView.line;
		});
		return [this._dot, ...lines];
	}
}
