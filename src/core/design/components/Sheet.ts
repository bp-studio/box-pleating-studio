
interface JSheet {
	width: number;
	height: number;

	/** Current zooming. @session */
	zoom?: number;

	/** Current scrolling position. @session */
	scroll?: IPoint;
}

//////////////////////////////////////////////////////////////////
/**
 * `Sheet` 是代表一個工作區域。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Sheet extends Mountable implements ISerializable<JSheet>, IDesignObject, ITagObject {

	public static readonly $FULL_ZOOM = 100;
	public static readonly $MIN_SIZE = 8;

	public readonly $tag: string;

	@unorderedArray public get $controls(): Control[] {
		let result: Control[] = [];
		for(let map of this._controlMaps) result.push(...map());
		return result;
	}

	/** 所有活躍的控制 */
	@shrewd public get $activeControls(): readonly Control[] {
		this.$disposeEvent();
		if(!this.$design.$dragging) {
			// 因為 isActive 是一個會完整更新 Pattern 的龐大計算，我們只有在非拖曳的時候完整更新清單，
			// 以避免拖曳的時候被 Vue.js 的呼叫觸發了多餘的計算和繪製
			this._activeControlCache = this.$controls.filter(c => Mountable.$isActive(c));
		}
		return this._activeControlCache;
	}
	private _activeControlCache: Control[] = [];

	/** 考慮一個點進行指定位移之後的結果來修正位移 */
	public $constraint(v: Vector, p: Readonly<IPoint>): Vector {
		return v.$range(
			new Fraction(-p.x), new Fraction(this.width - p.x),
			new Fraction(-p.y), new Fraction(this.height - p.y)
		);
	}

	/** @exports */
	public get width() { return this.mWidth; }
	public set width(v) {
		if(v >= Sheet.$MIN_SIZE && v >= this._independentRect.width) {
			let d = v - this._independentRect.right;
			if(d < 0) {
				for(let i of this.$independents) {
					Draggable.$move(i, { x: d, y: 0 });
				}
			}
			this.mWidth = v;
		}
	}
	@action private mWidth: number;

	/** @exports */
	public get height() { return this.mHeight; }
	public set height(v) {
		if(v >= Sheet.$MIN_SIZE && v >= this._independentRect.height) {
			let d = v - this._independentRect.top;
			if(d < 0) {
				for(let i of this.$independents) {
					Draggable.$move(i, { x: 0, y: d });
				}
			}
			this.mHeight = v;
		}
	}
	@action private mHeight: number;

	/** @exports */
	public get zoom() { return this._zoom; }
	public set zoom(v) {
		if(v < Sheet.$FULL_ZOOM) return;
		this.$studio?.$display.$zoom(v);
	}
	@shrewd public _zoom: number;

	constructor(design: Design, tag: string, sheet: JSheet, ...maps: IterableFactory<Control>[]) {
		super(design);
		this.$tag = tag;
		this.width = sheet.width;
		this.height = sheet.height;
		this._zoom = sheet.zoom ?? Sheet.$FULL_ZOOM;
		this.$scroll = sheet.scroll ?? { x: 0, y: 0 };
		this._controlMaps = maps;
		design.$viewManager.$createView(this);
	}

	/** 記載所有這個 `Sheet` 中的 `Control` 來源 */
	private _controlMaps: IterableFactory<Control>[];

	public get $design() {
		return this.$mountTarget as Design;
	}

	@shrewd public get $isActive() {
		return this.$design.sheet == this;
	}

	@shrewd public get $displayScale() {
		return this.$studio ? this.$studio.$display.$scale : 1;
	}

	public toJSON(session: boolean = false): JSheet {
		let result: JSheet = { width: this.width, height: this.height };
		if(session) {
			result.zoom = this._zoom;
			result.scroll = this.$scroll;
		}
		return result;
	}

	@shrewd get size() {
		return Math.max(this.width, this.height);
	}

	// 暫時沒用到
	// public contains(p: IPoint): boolean {
	// 	return 0 <= p.x && p.x <= this.width && 0 <= p.y && p.y <= this.height;
	// }

	@unorderedArray public get $independents(): IndependentDraggable[] {
		return this.$controls.filter(
			(c: Control): c is IndependentDraggable => c instanceof IndependentDraggable
		);
	}

	/**
	 * 所有的 `IndependentDraggable` 所佔據空間的矩形。
	 *
	 * 這個資料故意不採用計算屬性而是採用一個反應方法來持續更新它，
	 * 為的是避免導致循環參照。
	 */
	private _independentRect: Rectangle = new Rectangle(Point.ZERO, Point.ZERO);

	/** 更新 `_independentRect` 的反應方法 */
	@shrewd private _getIndependentRect() {
		let x1 = Number.POSITIVE_INFINITY, y1 = Number.POSITIVE_INFINITY;
		let x2 = Number.NEGATIVE_INFINITY, y2 = Number.NEGATIVE_INFINITY;
		for(let i of this.$independents) {
			let l = i.$location;
			if(l.x < x1) x1 = l.x;
			if(l.x + i.width > x2) x2 = l.x + i.width;
			if(l.y < y1) y1 = l.y;
			if(l.y + i.height > y2) y2 = l.y + i.height;
		}
		this._independentRect = new Rectangle(new Point(x1, y1), new Point(x2, y2));
	}

	@unorderedArray private get _labeledControls() {
		return this.$controls.filter((c: Control) =>
			this.$design.$viewManager.$get(c) instanceof LabeledView
		);
	}

	// 這個值如果直接做成計算屬性會導致循環參照，所以要用一個反應方法來延遲更新它
	@shrewd public $margin = 0;

	@shrewd private _getMargin() {
		if(!this.$isActive || !this.$design.$isActive) return;
		let controls = this._labeledControls;
		let vm = this.$design.$viewManager;
		let m = !controls.length ? 0 :
			Math.max(...controls.map(c => (vm.$get(c) as LabeledView<Control>).$overflow));
		setTimeout(() => this.$margin = m, 0);
	}

	@shrewd public $scroll: IPoint;


	public $clearSelection() {
		for(let c of this.$controls) c.$selected = false;
	}
}
