
interface JGadget {

	/** 所有組成當前 `Gadget` 的 `Piece` */
	pieces: JPiece[];

	/** 這個 `Gadget` 相對於其第一個 `Piece` 的 p[0] 的位移植 */
	offset?: IPoint;

	anchors?: JAnchor[];
}

interface JAnchor {
	/** 連接時要保留的間隙 */
	slack?: number;

	/** 自訂這個 Anchor 的位置，如果不指定，會直接根據 Gadget 來推算 */
	location?: IPoint;
}

/** 第一個值傳回點，第二個值傳回來自的 Piece（若有的話） */
type AnchorMap = [Point, number | null];

//////////////////////////////////////////////////////////////////
/**
 * `Gadget` 是一個對應於一個 `Overlap` 的 `Device` 部件。
 * 它總是具有 4 個 `Anchor`。
 *
 * 這個東西只是抽象的計算類別，且沒有任何反應成份，因此不需要繼承任何東西。
 * `Gadget` 本身實作了 `JGadget` 介面，並且在執行 `setup` 方法之前可以跟普通的 `JGadget` 一樣操作內容。
 */
//////////////////////////////////////////////////////////////////

class Gadget implements JGadget, ISerializable<JGadget> {

	/** @exports */
	public pieces: Piece[];

	/** @exports */
	public offset?: IPoint;

	/** @exports */
	public anchors?: JAnchor[];

	constructor(gadget: JGadget) {
		this.pieces = gadget.pieces.map(p => Piece.$instantiate(p));
		this.offset = gadget.offset;
		this.pieces.forEach(p => p.$offset(this.offset));
		this.anchors = gadget.anchors;
	}

	public toJSON(): JGadget {
		return {
			pieces: this.pieces,
			offset: this.offset,
			anchors: this.anchors
		};
	}

	/** 傳回 Gadget 的 AnchorMap 陣列（點的位置是相位變換之前） */
	@onDemand public get $anchorMap(): PerQuadrant<AnchorMap> {
		return MakePerQuadrant<AnchorMap>(q => {
			if(this.anchors?.[q]?.location) {
				let p = new Point(this.anchors[q].location!);
				if(this.offset) p.addBy(new Vector(this.offset));
				return [p, null];
			} else {
				if(this.pieces.length == 1) return [this.pieces[0].$anchors[q]!, 0];
				for(let [i, p] of this.pieces.entries()) {
					if(p.$anchors[q]) return [p.$anchors[q]!, i];
				}
				debugger; // 理論上不應該會跑到這裡
				throw new Error();
			}
		});
	}

	private _getSlack(q: QuadrantDirection) {
		return this.anchors?.[q]?.slack ?? 0;
	}

	@onDemand public get $slacks(): PerQuadrant<number> {
		return MakePerQuadrant(q => this._getSlack(q));
	}

	/** 取得這個 Gadget 的 sx 整數全長 */
	@onDemand public get sx(): number {
		return Math.ceil(this.$anchorMap[2][0].x - this.$anchorMap[0][0].x);
	}

	/** 取得這個 Gadget 的 sy 整數全長 */
	@onDemand public get sy(): number {
		return Math.ceil(this.$anchorMap[2][0].y - this.$anchorMap[0][0].y);
	}

	public $reverseGPS(): Gadget {
		let g = Gadget.$instantiate(this.toJSON());
		let [p1, p2] = g.pieces;
		let sx = Math.ceil(Math.max(p1.sx, p2.sx));
		let sy = Math.ceil(Math.max(p1.sy, p2.sy));
		p1.$reverse(sx, sy);
		p2.$reverse(sx, sy);
		return g;
	}

	public $addSlack(q: QuadrantDirection, slack: number): Gadget {
		this.anchors = this.anchors || [];
		this.anchors[q] = this.anchors[q] || {};
		this.anchors[q].slack = (this.anchors[q].slack ?? 0) + slack;
		return this;
	}

	/**
	 * 設定當前 Gadget 相對於一個連接對象應有的 slack
	 * @param g 連接對象
	 * @param q1 從自身的哪一個象限點連接出去（0 或 2）
	 * @param q2 連接到對方的哪一個象限點（1 或 3）
	 */
	public $setupConnectionSlack(g: Gadget, q1: QuadrantDirection, q2: QuadrantDirection): number {
		let c1 = this.$contour, c2 = g.$contour;
		let f = q1 == 0 ? 1 : -1;
		let step = new Vector(f, f);
		let slack = new Fraction(this._getSlack(q1))
		let v = g.$anchorMap[q2][0].sub(Point.ZERO).addBy(step.$scale(slack));

		// 下一行中的 Point.ZERO 原本是 this.anchorMap[0][0].add(step.scale(this._getSlack(0)))
		// 這個照我的理解基本上一定就是 Point.ZERO，因此可以簡化
		c1 = PathUtil.$shift(c1, q1 == 0 ? v : v.add(Point.ZERO.sub(this.$anchorMap[2][0])));

		// 開始做碰撞測試
		let s = 0;
		while(PathUtil.$polygonIntersect(c1, c2)) {
			c1 = PathUtil.$shift(c1, step);
			s++;
		}
		this.$addSlack(q1, s);
		return s;
	}

	@onDemand public get $contour(): Path {
		let p = this.pieces, contour = p[0].$shape.contour;
		for(let i = 1; i < p.length; i++) contour = PathUtil.$join(contour, p[i].$shape.contour);
		return contour;
	}

	/**
	 * 取出 Gadget 在接力情況下的剩餘 x 分量。
	 * @param q1 被接力的點，值為 1 或 3
	 * @param q2 對方的點，值為 0 或 2
	 */
	public rx(q1: QuadrantDirection, q2: QuadrantDirection): number {
		return Math.abs(this.$anchorMap[q1][0].x - this.$anchorMap[q2][0].x);
	}

	/**
	 * 取出 Gadget 在接力情況下的剩餘 x 分量。
	 * @param q1 被接力的點，值為 1 或 3
	 * @param q2 對方的點，值為 0 或 2
	 */
	public ry(q1: QuadrantDirection, q2: QuadrantDirection): number {
		return Math.abs(this.$anchorMap[q1][0].y - this.$anchorMap[q2][0].y);
	}

	/** 自身是否包含指定的點（座標為 offset 之前的座標） */
	public $intersects(p: Point, v: Vector): boolean {
		let test = this.$contour.map((v, i, a) => new Line(v, a[(i + 1) % a.length]));
		return test.some(l => Trace.$getIntersection(l, p, v));
	}

	//////////////////////////////////////////////////////////////////////////////////////////
	// 靜態方法
	//////////////////////////////////////////////////////////////////////////////////////////

	/** 把 JGadget 中的 JPiece 全部實體化 */
	public static $instantiate(g: JGadget): Gadget {
		if(g instanceof Gadget) return g;
		else return new Gadget(g);
	}

	/** 簡化 JSON 資料的呈現 */
	public static $simplify(g: JGadget): JGadget {
		if(g.offset && g.offset.x == 0 && g.offset.y == 0) delete g.offset;
		if(g.anchors) {
			for(let [i, a] of g.anchors.entries()) {
				if(!a) continue;
				if(a.slack === 0) delete a.slack;
				if(Object.keys(a).length == 0) delete g.anchors[i];
			}
			if(!g.anchors.some(a => !!a)) delete g.anchors;
		}
		return g;
	}
}
