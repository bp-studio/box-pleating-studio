
interface JSheet {
	width: number;
	height: number;
	scale: number;
}

//////////////////////////////////////////////////////////////////
/**
 * `Sheet` 是代表一個工作區域。
 */
//////////////////////////////////////////////////////////////////

@shrewd class Sheet extends Mountable implements ISerializable<JSheet>, IDesignObject {

	@shrewd public get controls(): Control[] {
		var result: Control[] = [];
		for(let map of this._controlMaps) result.push(...map());
		return result;
	}

	private _activeControlCache: Control[] = [];
	@shrewd public get activeControls(): readonly Control[] {
		if(!this.design.dragging) {
			// 因為 isActive 是一個會完整更新 Pattern 的龐大計算，我們只有在非拖曳的時候完整更新清單，
			// 以避免拖曳的時候被 Vue.js 的呼叫觸發了多餘的計算和繪製
			this._activeControlCache = this.controls.filter(c => Mountable.isActive(c));
		}
		return this._activeControlCache;
	}

	public readonly view: SheetView;

	/** 考慮一個點進行指定位移之後的結果來修正位移 */
	public constraint(v: Vector, p: Readonly<IPoint>): Vector {
		return v.range(-p.x, this.width - p.x, -p.y, this.height - p.y);
	}

	@action({
		validator(this: Sheet, v: number) {
			let ok = v >= 8 && v >= this._independentRect.width;
			let d = v - this._independentRect.right;
			if(ok && d < 0) for(let i of this.independents) i.location.x += d;
			return ok;
		}
	})
	public width: number;

	@action({
		validator(this: Sheet, v: number) {
			let ok = v >= 8 && v >= this._independentRect.height;
			let d = v - this._independentRect.top;
			if(ok && d < 0) for(let i of this.independents) i.location.y += d;
			return ok;
		}
	})
	public height: number;

	@action({
		validator(this: Sheet, v: number) {
			return v >= Math.min(10, Math.ceil(this.$studio?.$display.getAutoScale() ?? 10));
		}
	}) public scale: number;

	constructor(design: Design, sheet: JSheet, ...maps: IterableFactory<Control>[]) {
		super(design);
		this.width = sheet.width;
		this.height = sheet.height;
		this.scale = sheet.scale;
		this._controlMaps = maps;
		this.view = new SheetView(this);
	}

	/** 記載所有這個 `Sheet` 中的 `Control` 來源 */
	private _controlMaps: IterableFactory<Control>[];

	public get design() {
		return this.mountTarget as Design;
	}

	@shrewd public get isActive() {
		return this.design.sheet == this;
	}

	@shrewd public get displayScale() {
		return this.$studio ? this.$studio.$display.scale : 1;
	}

	public toJSON(): JSheet {
		return { width: this.width, height: this.height, scale: this.scale };
	}

	@shrewd get size() {
		return Math.max(this.width, this.height);
	}

	public contains(p: IPoint): boolean {
		return 0 <= p.x && p.x <= this.width && 0 <= p.y && p.y <= this.height;
	}

	@shrewd get independents(): IndependentDraggable[] {
		return this.controls.filter((c: Control): c is IndependentDraggable => c instanceof IndependentDraggable);
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
		for(let i of this.independents) {
			let l = i.location;
			if(l.x < x1) x1 = l.x;
			if(l.x > x2) x2 = l.x;
			if(l.y < y1) y1 = l.y;
			if(l.y > y2) y2 = l.y;
		}
		this._independentRect = new Rectangle(new Point(x1, y1), new Point(x2, y2));
	}

	// 這個值如果直接做成計算屬性會導致循環參照，所以要用一個反應方法來延遲更新它
	@shrewd public margin = 0;

	@shrewd private getMargin() {
		if(this.design.sheet != this) return;
		let controls = this.controls.filter((c: Control): c is ViewedControl => c instanceof ViewedControl);
		let m = controls.length ? Math.max(...controls.map(c => c.view.overflow)) : 0;
		setTimeout(() => this.margin = m, 0);
	}
}
