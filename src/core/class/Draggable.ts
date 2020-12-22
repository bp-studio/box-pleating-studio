
//////////////////////////////////////////////////////////////////
/**
 * `Draggable` 是一個可能可以被拖曳移動的 `ViewedControl`。
 *
 * 繼承類別必須覆寫 `constraint` 方法來定義移動的行為。
 */
//////////////////////////////////////////////////////////////////

abstract class Draggable extends ViewedControl {

	/** 拖曳剛開始的時候，滑鼠位置與物件位置之間的差異向量 */
	private _dragOffset: Vector;

	/** 初始化拖曳 */
	public dragStart(cursor: Point) {
		this._dragOffset = cursor.sub(this.location);
	}

	/** 修正拖曳；可以傳入滑鼠位置或位移向量 */
	public dragConstraint(point: Point): Point;
	public dragConstraint(vector: Vector): Vector;
	public dragConstraint(by: Point | Vector) {
		if(by instanceof Vector) {
			return this.constraint(by, this.location);
		} else {
			let l = new Point(this.location);
			let v = this.constraint(by.sub(this._dragOffset).sub(l), l);
			return l.add(v).add(this._dragOffset);
		}
	}

	/** 進行拖曳；可以傳入滑鼠位置或位移向量 */
	public drag(point: Point): void;
	public drag(vector: Vector): void;
	public drag(by: Point | Vector) {
		if(by instanceof Point) {
			by = by.sub(this._dragOffset);
			if(!by.eq(this.location)) this.design.takeAction(() => {
				this.location.x = by.x;
				this.location.y = by.y;
			});
		} else {
			if(!by.eq(Vector.ZERO)) this.design.takeAction(() => {
				this.location.x += by.x;
				this.location.y += by.y;
			});
		}
	}

	/**
	 * 把一個傳入的 `Vector` 進行修正到實際上可以被容許的移動範圍之上，
	 * 預設行為是會一律修正成零向量（換句話說，`Control` 將不能動）。
	 *
	 * 由於 `IndependentDraggable.location` 會呼叫 `constraint` 方法來進行自我修正，
	 * `constraint` 方法再參考 `this.location` 會發生循環參照，
	 * 為了避免此問題，所有的呼叫都會傳入當前的位置作為第二個參數。
	 */
	protected constraint(v: Vector, location: Readonly<IPoint>): Vector {
		return Vector.ZERO;
	}

	/** 當前位置 */
	@shrewd public location: IPoint = { x: 0, y: 0 };
}

//////////////////////////////////////////////////////////////////
/**
 * `IndependentDraggable` 是一個拖曳行為與其它物件無關的 `Draggable`。
 *
 * 這樣的物件會限定住 `Sheet` 所能縮小的程度。
 */
//////////////////////////////////////////////////////////////////

abstract class IndependentDraggable extends Draggable {

	/** 物件在 Sheet 上佔據的高度 */
	public abstract readonly height: number;

	/** 物件在 Sheet 上佔據的寬度 */
	public abstract readonly width: number;
}
