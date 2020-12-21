@shrewd class RiverView extends ControlView<River> {

	private _hinge: paper.CompoundPath;
	private _shade: paper.CompoundPath;
	private _ridge: paper.CompoundPath;

	/** 目前這條河的閉包邊界；用於下一條河的扣除 */
	public boundary: paper.CompoundPath;

	constructor(river: River) {
		super(river);

		this.$addItem(Layer.shade, this._shade = new paper.CompoundPath(Style.shade));
		this.$addItem(Layer.hinge, this._hinge = new paper.CompoundPath(Style.hinge));
		this.$addItem(Layer.ridge, this._ridge = new paper.CompoundPath(Style.ridge));

		this.boundary = new paper.CompoundPath({});
	}

	public contains(point: paper.Point) {
		return this.control.sheet.view.contains(point) && this._shade.contains(point);
	}

	/** 跟當前的河有關的基本資訊；這些除非樹的結構有改變，不然不用重新計算 */
	@shrewd public get info(): RiverInfo {
		if(this.disposed) return { adjacent: [], length: 0, components: [] };

		let edge = this.control.edge;
		let a: readonly TreeEdge[];
		let c: readonly [Flap, TreeNode][];

		if(edge.wrapSide == 0) {
			c = this.toComponents(edge.l1, edge.n1).concat(this.toComponents(edge.l2, edge.n2));
			a = edge.a1.concat(edge.a2);
		} else if(edge.wrapSide == 2) {
			c = this.toComponents(edge.l2, edge.n2); a = edge.a2;
		} else {
			c = this.toComponents(edge.l1, edge.n1); a = edge.a1;
		}

		return { adjacent: a, length: edge.length, components: c };
	}

	private toComponents(l: readonly TreeNode[], n: TreeNode): [Flap, TreeNode][] {
		return l.map(l => [this.design.flaps.get(l)!, n]);
	}

	public get design(): Design {
		return this.control.sheet.design;
	}

	/** 建立一系列監視元件 */
	private readonly components = new Mapping(
		() => this.info.components,
		([f, n]) => new RiverComponent(this, f, n)
	);

	protected onDispose() {
		Shrewd.terminate(this.components);
		super.onDispose();
	}

	/** 計算當前河的閉包 */
	@shrewd private get closure(): paper.PathItem {
		let path = new paper.PathItem();
		if(this.disposed) return path;
		for(let component of this.components.values()) {
			let c = component.contour;
			if(path.isEmpty()) path = c;
			else path = path.unite(c, { insert: false });
		}
		return path;
	}

	/** 扣除掉內部的河的閉包，得到當前河的正確路徑；其中外側會以逆時鐘定向、內側以順時鐘定向 */
	@shrewd private get actualPath(): paper.PathItem {
		let { adjacent } = this.info;
		let design = this.control.sheet.design;
		let path = this.closure;
		if(this.disposed) return path;
		for(let e of adjacent) {
			if(e.isRiver) {
				let r = design.rivers.get(e)!;
				for(let item of r.view.closure.children ?? [r.view.closure]) {
					path = path.subtract(item as paper.PathItem, { insert: false });
				}
			} else {
				let f = design.flaps.get(e.n1.degree == 1 ? e.n1 : e.n2)!;
				f.view.renderHinge();
				path = path.subtract(f.view.hinge, { insert: false });
			}
		}
		return path.reorient(false, true); // 定向
	}

	protected render() {
		PaperUtil.replaceContent(this.boundary, this.closure, true);
		PaperUtil.replaceContent(this._shade, this.actualPath, false);
		PaperUtil.replaceContent(this._hinge, this.actualPath, false);
		this.renderRidge();
	}

	/** 收集所有自身的內直角資訊；這部份與 openAnchors 無關，分開計算以增加效能 */
	@shrewd private get corners(): [Point, Point, boolean][] {
		if(this.disposed) return [];

		// paper.js 的 Point 類別可能會有計算偏差，因此這邊都轉換成有理數型物件
		let path = this.actualPath;
		let p_paths = (path.children ?? [path]) as paper.Path[];
		let r_paths = p_paths.map(path => path.segments.map(p => new Point(p.point)));
		if(r_paths[0].length == 0) return [];

		let { paths, map } = PathUtil.collect(r_paths);

		// 整理所有的內直角
		let result: [Point, Point, boolean][] = [];
		for(let p of paths) {
			let l = p.length;
			let prev = p[l - 1];
			let now = p[0];
			let v_in = now.sub(prev);
			for(let i = 0; i < l; i++) {
				let next = p[(i + 1) % l];
				let v_out = next.sub(now);
				if(v_in.dot(v_out) == 0 && v_in.rotate90().dot(v_out) > 0) { // 如果走了左轉
					let v = new Vector(
						Math.sign(v_out.x) - Math.sign(v_in.x),
						Math.sign(v_out.y) - Math.sign(v_in.y)
					).scale(this.control.length);
					let target = now.add(v);
					result.push([now, target, map.has(target.toString())]);
				}
				prev = now;
				now = next;
				v_in = v_out;
			}
		}
		return result;
	}

	private renderRidge() {
		this._ridge.removeChildren();

		for(let [from, to, self] of this.corners) {
			// 優先尋找 Pattern 的開放角落
			let line = new Line(from, to);
			let f = line.slope.value, key = f + "," + (from.x - f * from.y);
			let arr = this.control.sheet.design.openAnchors.get(key) ?? [];
			let p = arr.find(p => line.contains(p, true));

			if(p) PaperUtil.addLine(this._ridge, from, p);
			else if(self) {
				// 如果結果也是自己的一個角就直接連線
				PaperUtil.addLine(this._ridge, from, to);
			}
		}
	}

	protected renderSelection(selected: boolean) {
		this._shade.visible = selected;
	}
}

interface RiverInfo {
	readonly adjacent: readonly TreeEdge[];
	readonly length: number;
	readonly components: readonly [Flap, TreeNode][];
}

//////////////////////////////////////////////////////////////////
/**
 * `RiverComponent` 是負責監視針對特定的 `Flap` 在對應於特定 `River`
 * 的距離之下產生的輪廓的物件。
 *
 * 由於這些東西只要 Flap 本身以及相關的 Pattern 沒有發生變更就不需要重新計算，
 * 特別利用一個反應式物件來監視，以增進效能。
 */
//////////////////////////////////////////////////////////////////

@shrewd class RiverComponent extends Disposible {

	constructor(private view: RiverView, private flap: Flap, private node: TreeNode) { super(view); }

	protected get shouldDispose(): boolean {
		return super.shouldDispose || this.flap.disposed ||
			!this.view.info.components.some(c => c[0] == this.flap);
	}

	@shrewd private get distance(): number {
		if(this.disposed) return 0;
		let { design, info } = this.view, flap = this.flap;
		let dis = design.tree.dist(flap.node, this.node);
		return dis - flap.radius + info.length;
	}

	@shrewd public get contour(): paper.PathItem {
		this.flap.view.draw();
		return this.flap.view.makeContour(this.distance);
	}
}
