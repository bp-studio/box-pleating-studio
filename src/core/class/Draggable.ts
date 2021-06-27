
//////////////////////////////////////////////////////////////////
/**
 * {@link Draggable} 是一個可能可以被拖曳移動的 {@link ViewedControl}。
 *
 * 繼承類別必須覆寫 {@link Draggable.$constraint $constraint} 方法來定義移動的行為。
 */
//////////////////////////////////////////////////////////////////

abstract class Draggable extends Control {

	public abstract get $tag(): string;

	/** 拖曳剛開始的時候，滑鼠位置與物件位置之間的差異向量 */
	private _dragOffset: Vector;

	/** 初始化拖曳 */
	public $dragStart() {
		this._dragOffset = CursorController.$offset(this.$location);
	}

	/** 修正拖曳；可以傳入滑鼠位置或位移向量 */
	public $dragConstraint(point: Point): Point;
	public $dragConstraint(vector: Vector): Vector;
	public $dragConstraint(by: Point | Vector) {
		if(by instanceof Vector) {
			return this.$constraint(by, this.$location);
		} else {
			let l = new Point(this.$location);
			let v = this.$constraint(by.sub(this._dragOffset).sub(l), l);
			return l.add(v).add(this._dragOffset);
		}
	}

	/** 進行拖曳；可以傳入滑鼠位置或位移向量 */
	public $drag(point: Point): void;
	public $drag(vector: Vector): void;
	public $drag(by: Point | Vector) {
		if(by instanceof Point) by = by.sub(this._dragOffset);
		else by = new Point(this.$location).add(by);
		if(!by.eq(this.$location)) {
			Draggable.$move(this, by.$toIPoint(), false);
			this.$onDragged();
		}
	}

	/** 真的發生拖曳之後的 callback。 */
	protected $onDragged() {
		// 預設是什麼都不會發生，在 Flap 和 Vertex 中有覆寫此行為。
	}

	/**
	 * 把一個傳入的 {@link Vector} 進行修正到實際上可以被容許的移動範圍之上，
	 * 預設行為是會一律修正成零向量（換句話說，{@link Control} 將不能動）。
	 *
	 * 由於 {@link IndependentDraggable.$location} 會呼叫 {@link Draggable.$constraint $constraint()} 方法來進行自我修正，
	 * `constraint` 方法再參考 `this.location` 會發生循環參照，
	 * 為了避免此問題，所有的呼叫都會傳入當前的位置作為第二個參數。
	 */
	protected $constraint(v: Vector, location: Readonly<IPoint>): Vector {
		return Vector.ZERO;
	}

	/** 當前位置 */
	@shrewd public $location: IPoint = { x: 0, y: 0 };

	/** 把 target 移動到 source 的相對應位置上 */
	public static $relocate(source: Draggable, target: Draggable, init = false) {
		if(!source || !target) return;
		// TODO: 不同的形狀的 Sheet 要如何處理
		let ss = source.$sheet, ts = target.$sheet;
		let pt: IPoint = {
			x: Math.round(source.$location.x / ss.width * ts.width),
			y: Math.round(source.$location.y / ss.height * ts.height),
		};

		if(init) Draggable.$assign(target.$location, pt);
		else Draggable.$move(target, pt, false);
	}

	public static $move(target: Draggable, loc: IPoint, relative: boolean = true) {
		target.$design.$history?.$move(target, loc, relative);
		Draggable.$assign(target.$location, loc);
	}

	public static $assign(target: IPoint, value: IPoint) {
		target.x = value.x;
		target.y = value.y;
	}
}
