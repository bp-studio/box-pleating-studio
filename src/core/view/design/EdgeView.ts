import { LabeledView } from "../class";
import { PaperUtil } from "../util/PaperUtil";
import { ViewService } from "bp/env/service";
import { Layer, Style } from "bp/global";
import type { Edge } from "bp/design";
import type { IPoint } from "bp/math";

//=================================================================
/**
 * {@link EdgeView} 是對應於 {@link Edge} 的 {@link LabeledView}。
 */
//=================================================================

@shrewd export class EdgeView extends LabeledView<Edge> {

	public readonly line: paper.Path;

	/** 加粗的直線空間，方便判定選取動作 */
	private readonly _lineRegion: paper.Path;

	constructor(edge: Edge) {
		super(edge);
		this.$addItem(Layer.$ridge, this.line = new paper.Path.Line(Style.$edge));
		this._lineRegion = new paper.Path.Line({ strokeWidth: 15 });
	}

	public $contains(point: paper.Point): boolean {
		return (this._lineRegion.hitTest(point) != null ||
			this._glow.hitTest(point.transform(this._glow.layer.matrix.inverted())) != null) &&
			!ViewService.$contains(this._control.$v1, point) &&
			!ViewService.$contains(this._control.$v2, point);
	}

	protected $render(): void {
		let l1 = this._control.$v1.$location, l2 = this._control.$v2.$location;
		this._lineRegion.segments[0].point.set([l1.x, l1.y]);
		this._lineRegion.segments[1].point.set([l2.x, l2.y]);
		this.line.copyContent(this._lineRegion);
	}

	protected $renderSelection(selected: boolean): void {
		let color: paper.Color;
		if(selected) color = PaperUtil.$red;
		else if(this.$dark) color = PaperUtil.$gray;
		else color = PaperUtil.$black;
		this._label.fillColor = this._label.strokeColor = this.line.strokeColor = color;
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		this.line.strokeWidth = selected ? 3 : 2;
	}

	protected $renderUnscaled(): void {
		this._label.content = this._control.length.toString();
	}

	protected get _labelLocation(): IPoint {
		let l1 = this._control.$v1.$location, l2 = this._control.$v2.$location;
		return { x: (l1.x + l2.x) / 2, y: (l1.y + l2.y) / 2 };
	}

	protected get _labelAvoid(): paper.Path[] {
		this.$draw();
		return [this.line];
	}
}
