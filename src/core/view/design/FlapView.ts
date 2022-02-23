import { PaperUtil } from "../util/PaperUtil";
import { RiverHelperBase } from "../helper";
import { LabeledView } from "../class";
import { ViewService } from "bp/env/service";
import { Layer, Style, makePerQuadrant, shrewdStatic } from "bp/global";
import type { Flap } from "bp/design";
import type { IPoint, PolyBool } from "bp/math";
import type { PerQuadrant } from "bp/global";
import type { ClosureView } from "./RiverView";

//=================================================================
/**
 * {@link FlapView} 是對應於 {@link Flap} 的 {@link LabeledView}。
 */
//=================================================================

@shrewd export class FlapView extends LabeledView<Flap> implements ClosureView {

	public readonly hinge: paper.Path;
	private readonly _shade: paper.Path;
	private readonly _dots: PerQuadrant<paper.Path.Circle>;
	private readonly _circle: paper.Path;
	private readonly _outerRidges: paper.CompoundPath;
	private readonly _innerRidges: paper.CompoundPath;
	private readonly _component: RiverHelperBase;

	constructor(flap: Flap) {
		super(flap);

		this.$addItem(Layer.$shade, this._shade = new paper.Path.Rectangle(Style.$shade));
		this.$addItem(Layer.$hinge, this.hinge = new paper.Path.Rectangle(Style.$hinge));
		this.$addItem(Layer.$shade, this._circle = new paper.Path(Style.$circle));

		this._dots = makePerQuadrant(i => {
			let d = new paper.Path.Circle(Style.$dot);
			this.$addItem(Layer.$dot, d);
			return d;
		});

		this.$addItem(Layer.$ridge, this._innerRidges = new paper.CompoundPath(Style.$ridge));
		this.$addItem(Layer.$ridge, this._outerRidges = new paper.CompoundPath(Style.$ridge));

		this._component = new RiverHelperBase(this, flap);
	}

	public $contains(point: paper.Point): boolean {
		return ViewService.$contains(this._control.$sheet, point) &&
			(this.hinge.contains(point) || this.hinge.hitTest(point) !== null);
	}

	@shrewdStatic public get $circle(): paper.Path {
		return this._makeRectangle(0);
	}

	@shrewdStatic public get $circleJSON(): string {
		return this.$circle.exportJSON();
	}

	/** 產生（附加額外距離 d）的矩形，預設會帶有圓角 */
	private _makeRectangle(d: number): paper.Path {
		let p = this._control.$points, r = this._control.node.$radius + d;
		return new paper.Path.Rectangle({
			from: [p[2].x - r, p[2].y - r],
			to: [p[0].x + r, p[0].y + r],
			radius: r,
		});
	}

	private _jsonCache: string[] = [];

	public $makeJSON(d: number): string {
		if(this._control.$selected) return this._makeRectangle(d).exportJSON();
		return this._jsonCache[d] = this._jsonCache[d] || this._makeRectangle(d).exportJSON();
	}

	@shrewdStatic private _clearCache(): void {
		if(!this._control.$design.$dragging && this._jsonCache.length) this._jsonCache = [];
	}

	public get $closure(): PolyBool.Shape {
		return this._component.$shape;
	}

	/** 這個獨立出來以提供 {@link RiverView} 的相依 */
	@shrewdStatic public $renderHinge(): void {
		if(this._control.$disposed) return;
		this._circle.visible = this.$display?.$settings.showHinge ?? false;
		let paths = PaperUtil.$fromShape(this.$closure);
		this.hinge.removeSegments();
		if(paths.length) this.hinge.add(...paths[0].segments); // 這邊頂多只有一個

		// 此處曾經偶然觸發錯誤但難以復現；備查
		else debugger;
	}

	@shrewdStatic private _renderDotsDark(): void {
		const color = this.$dark ? PaperUtil.$light : PaperUtil.$black;
		this._dots.forEach(d => d.strokeColor = color);
	}

	protected $render(): void {
		let w = this._control.width, h = this._control.height;

		this._circle.copyContent(this.$circle);

		this.$renderHinge();

		let points = makePerQuadrant(i => this._control.$points[i].$toPaper());

		// Inner ridges
		this._innerRidges.removeChildren();
		this._innerRidges.moveTo(points[3]);
		points.forEach(p => this._innerRidges.lineTo(p));
		this._innerRidges.visible = w > 0 || h > 0;

		// Outer ridges
		this._outerRidges.removeChildren();
		this._control.$quadrants.forEach((q, i) => {
			if(q.$pattern == null) PaperUtil.$addLine(this._outerRidges, points[i], q.$corner);
		});

		this._shade.copyContent(this.hinge);
	}

	protected $renderUnscaled(): void {
		let ds = this.$displayScale;
		let w = this._control.width, h = this._control.height;

		let fix = (p: paper.Point): number[] => [p.x * ds, -p.y * ds];
		makePerQuadrant(i => {
			let pt = this._control.$points[i].$toPaper();
			this._dots[i].position.set(fix(pt));
			return pt;
		});
		this._dots[2].visible = w > 0 || h > 0;
		this._dots[1].visible = this._dots[3].visible = w > 0 && h > 0;

		this._label.content = this._control.node.name;
	}

	/** 尺度太小的時候調整頂點繪製 */
	@shrewdStatic private _renderDot(): void {
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		let s = 3 * this._drawScale ** 0.75;
		makePerQuadrant(i => {
			this._dots[i].copyContent(new paper.Path.Circle({
				position: this._dots[i].position,
				radius: s,
			}));
		});
	}

	protected $renderSelection(selected: boolean): void {
		this._shade.visible = selected;
	}

	protected get _labelLocation(): IPoint {
		return this._control.$center;
	}

	protected get _labelAvoid(): paper.Path[] {
		return [...this._dots];
	}
}
