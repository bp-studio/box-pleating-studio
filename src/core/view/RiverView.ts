
@shrewd class RiverView extends ControlView<River> implements ClosureView {

	private _hinge: paper.CompoundPath;
	private _shade: paper.CompoundPath;
	private _ridge: paper.CompoundPath;

	/** 目前這條河的閉包邊界；用於下一條河的扣除 */
	public boundary: paper.CompoundPath;

	constructor(river: River) {
		super(river);

		this.$addItem(Layer.$shade, this._shade = new paper.CompoundPath(Style.$shade));
		this.$addItem(Layer.$hinge, this._hinge = new paper.CompoundPath(Style.$hinge));
		this.$addItem(Layer.$ridge, this._ridge = new paper.CompoundPath(Style.$ridge));

		this.boundary = new paper.CompoundPath({});
	}

	public $contains(point: paper.Point) {
		let vm = this._control.$design.$viewManager;
		return vm.$contains(this._control.$sheet, point) && this._shade.contains(point);
	}

	/** 跟當前的河有關的基本資訊；這些除非樹的結構有改變，不然不用重新計算 */
	@shrewd public get $info(): RiverInfo {
		this.$disposeEvent();
		let edge = this._control.edge;
		let adjacent: readonly TreeEdge[];
		let components: readonly string[];

		if(edge.$wrapSide == 0) {
			components = RiverView
				._toComponents(edge.l1, edge.n1)
				.concat(RiverView._toComponents(edge.l2, edge.n2));
			adjacent = edge.a1.concat(edge.a2);
		} else if(edge.$wrapSide == 2) {
			components = RiverView._toComponents(edge.l2, edge.n2);
			adjacent = edge.a2;
		} else {
			components = RiverView._toComponents(edge.l1, edge.n1);
			adjacent = edge.a1;
		}

		let inner: ClosureView[] = [];
		let design = this.$design;
		let vm = design.$viewManager;
		for(let e of adjacent) {
			if(e.$isRiver) {
				let r = design.$rivers.get(e)!;
				inner.push(vm.$get(r) as RiverView);
			} else {
				let f = design.$flaps.get(e.n1.$degree == 1 ? e.n1 : e.n2)!;
				inner.push(vm.$get(f) as FlapView);
			}
		}

		return { inner, length: edge.length, components };
	}

	private static _toComponents(leaves: readonly TreeNode[], n: TreeNode): string[] {
		return leaves.map(l => l.id + "," + n.id);
	}

	public get $design(): Design {
		return this._control.$sheet.$design;
	}

	/** 建立一系列監視元件 */
	private readonly _componentMap = new Mapping(
		() => this.$info.components,
		key => new RiverHelper(this, key.split(',').map(v => Number(v)))
	);

	@shrewd private get _components(): readonly RiverHelper[] {
		return [...this._componentMap.values()];
	}

	protected $onDispose() {
		Shrewd.terminate(this._componentMap);
		super.$onDispose();
	}

	/** 計算當前河的閉包輪廓 */
	@shape("closure") public get $closure(): PolyBool.Shape {
		this.$disposeEvent();
		let contours = this._components.map(c => c.$contour);
		// 這段程式碼是用來產生測試案利用的
		// if(contours.length > 10) {
		// 	let json = JSON.stringify(contours);
		// 	let union = JSON.stringify(PolyBool.union(contours));
		// 	debugger;
		// }
		return PolyBool.union(contours);
	}

	/** 當前河的內部輪廓 */
	@shape("interior") private get $interior(): PolyBool.Shape {
		this.$disposeEvent();
		return PolyBool.union(this.$info.inner.map(c => c.$closure));
	}

	@shrewd private get _closurePath(): paper.CompoundPath {
		return new paper.CompoundPath({
			children: PaperUtil.$fromShape(this.$closure),
		});
	}

	/**
	 * 扣除掉內部的河的閉包，得到當前河的正確路徑；其中外側會以逆時鐘定向、內側以順時鐘定向。
	 *
	 * 這邊的一個關鍵在於我們不需要再執行一次多邊形布林運算；
	 * 由於閉包輪廓和內部輪廓理論上不會相交，
	 * 我們只要把它們都放入 CompoundPath 之中、然後再重新定向就自動會是對的了。
	 */
	@shrewd private get _actualPath(): paper.CompoundPath {
		this.$disposeEvent();
		let closure = this._closurePath.children;
		let interior = PaperUtil.$fromShape(this.$interior);
		let actual = new paper.CompoundPath({
			children: closure.concat(interior).map(p => p.clone()),
		});
		actual.reorient(false, true);
		return actual;
	}

	protected $render() {
		PaperUtil.$replaceContent(this.boundary, this._closurePath, false);
		PaperUtil.$replaceContent(this._shade, this._actualPath, false);
		PaperUtil.$replaceContent(this._hinge, this._actualPath, false);
	}

	/** 收集所有自身的內直角資訊；這部份與 openAnchors 無關，分開計算以增加效能 */
	@shrewd private get _corners(): [Point, Point, boolean][] {
		this.$disposeEvent();

		// paper.js 的 Point 類別可能會有計算偏差，因此這邊都轉換成有理數型物件
		let path = this._actualPath;
		let p_paths = (path.children ?? [path]) as paper.Path[];
		let r_paths = p_paths.map(p => p.segments.map(pt => new Point(pt.point)));
		if(r_paths[0].length == 0) return [];

		let { paths, map } = PathUtil.$collect(r_paths);

		// 整理所有的內直角
		let result: [Point, Point, boolean][] = [];
		for(let p of paths) {
			let l = p.length;
			let prev = p[l - 1];
			let now = p[0];
			let v_in = now.sub(prev);
			let width = new Fraction(this._control.length);
			for(let i = 0; i < l; i++) {
				let next = p[(i + 1) % l];
				let v_out = next.sub(now);
				if(v_in.dot(v_out) == 0 && v_in.$rotate90().dot(v_out) > 0) { // 如果走了左轉
					let v = new Vector(
						Math.sign(v_out.x) - Math.sign(v_in.x),
						Math.sign(v_out.y) - Math.sign(v_in.y)
					).$scale(width);
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

	@shrewd private _renderRidge() {
		// 建立相依性
		let oa = this._control.$sheet.$design.$stretches.$openAnchors;
		this.$draw(); // 脊線繪製必須在輪廓繪製之後執行

		/*
		 * 1065 修正：即使輪廓的形狀沒有發生變化，
		 * 當 $openAnchors 有發生變化的時候也是一樣要重新繪製脊線，
		 * 否則如果 Pattern 的錨點剛好在河的內部移動（但又剛好沒有改變到輪廓）的時候就會發生繪製錯誤。
		 * 這相對來說是比較不容易發生的現象，因此這個錯誤很晚才被發現到。
		 *
		 * 確實這樣修改的結果會使得任何 $openAnchor 改變的時候、全部的河都會重新繪製脊線，
		 * 這確實是有一點沒效率沒錯，但是暫時先這樣修正，之後有機會再改進。
		 * 這部份應該相對來說並不是造成效能不佳的主因，所以應該不是很急迫。
		 */

		this._ridge.removeChildren();

		for(let [from, to, self] of this._corners) {
			// 優先尋找 Pattern 的開放角落
			let line = new Line(from, to);
			let f = line.$slope.$value, key = f + "," + (from.x - f * from.y);
			let arr = oa.get(key) ?? [];
			let point = arr.find(p => line.$contains(p, true));

			if(point) {
				PaperUtil.$addLine(this._ridge, from, point);
			} else if(self) {
				// 如果結果也是自己的一個角就直接連線
				PaperUtil.$addLine(this._ridge, from, to);
			}
		}
	}

	protected $renderSelection(selected: boolean) {
		this._shade.visible = selected;
	}
}

interface ClosureView extends View {
	$closure: PolyBool.Shape;
}

interface RiverInfo {
	readonly inner: readonly ClosureView[];
	readonly length: number;
	readonly components: readonly string[];
}
