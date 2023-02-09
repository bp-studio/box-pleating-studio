import { dist } from "../context/tree";
import { Direction, opposite } from "shared/types/direction";
import { Rectangle } from "core/math/rectangle";

import type { QuadrantDirection, SlashDirection } from "shared/types/direction";
import type { ITreeNode } from "../context";

//=================================================================
/**
 * {@link Junction} 負責計算兩個角片之間的重疊狀態。
 */
//=================================================================

export class Junction {

	public readonly $a: ITreeNode;
	public readonly $b: ITreeNode;
	public readonly $lca: ITreeNode;
	public readonly $sx!: number;
	public readonly $sy!: number;
	public readonly $ox!: number;
	public readonly $oy!: number;
	public readonly $dist: number;
	public readonly $valid: boolean = false;
	public readonly $fx!: number;
	public readonly $fy!: number;
	public readonly $base!: IPoint;
	public readonly $q1!: number;
	public readonly $q2!: number;

	/** {@link $b} 相對於 {@link $a} 的方向  */
	public readonly $direction!: QuadrantDirection;

	/** 斜向 */
	public readonly $slash!: SlashDirection;

	/** 同樣的非法重疊是否已經被繪製過了 */
	public $processed: boolean = false;

	/** 所有在幾何上覆蓋自身的 {@link Junction} */
	private readonly _coveredBy: Junction[] = [];

	constructor(a: ITreeNode, b: ITreeNode, lca: ITreeNode) {
		if(a.id > b.id) [a, b] = [b, a];
		this.$a = a;
		this.$b = b;

		this.$lca = lca;
		const d = dist(a, b, lca);
		this.$dist = d;

		const [t1, r1, b1, l1] = a.$AABB.$toValues();
		const [t2, r2, b2, l2] = b.$AABB.$toValues();

		const x = l2 - r1, y = b2 - t1;
		const sx = Math.max(l1 - r2, x);
		const sy = Math.max(b1 - t2, y);
		if(sx <= 0 || sy <= 0) return;
		if(sx * sx + sy * sy < d * d) return;

		this.$valid = true;
		this.$sx = sx;
		this.$sy = sy;
		this.$ox = d - sx;
		this.$oy = d - sy;

		this.$fx = Math.sign(x);
		this.$fy = Math.sign(y);
		const dir: QuadrantDirection = (this.$fx == this.$fy ? 0 : 1) + (y > 0 ? 0 : 2);
		this.$direction = dir;
		this.$slash = dir % 2;
		this.$q1 = a.id << 2 | dir;
		this.$q2 = b.id << 2 | opposite(dir);

		if(dir == Direction.UR) this.$base = { x: r1, y: t1 };
		else if(dir == Direction.UL) this.$base = { x: l1, y: t1 };
		else if(dir == Direction.LL) this.$base = { x: l1, y: b1 };
		else this.$base = { x: r1, y: b1 };
	}

	/**
	 * 自身是否被另外一個 {@link Junction}「實質上」覆蓋。
	 *
	 * 實質覆蓋是比幾何覆蓋進一步的概念：
	 * 如果 A 覆蓋了 B、B 覆蓋了 C，可是 C 了 B 之外並沒有被其它 {@link Junction} 覆蓋，
	 * 那麼此時由於 B 會被 A 無效化，這麼一來 B 對 C 的覆蓋也是無效的，
	 * 所以 C 實質上其實是沒有被覆蓋。依此類推。
	 */
	public get $isCovered(): boolean {
		if(this._isCovered === undefined) {
			this._isCovered = this._coveredBy.some(j => !j.$isCovered);
		}
		return this._isCovered;
	}
	private _isCovered: boolean | undefined;

	/** 設置一個覆蓋 */
	public $setCoveredBy(that: Junction): void {
		this._coveredBy.push(that);
	}

	/** 清除覆蓋的資訊 */
	public $resetCovering(): void {
		this._coveredBy.length = 0;
		this._isCovered = undefined;
	}

	/** 根據指定的距離基準來取得覆蓋比較矩形 */
	public $getBaseRectangle(distanceToA: number): Rectangle {
		const x = this.$base.x + distanceToA * this.$fx;
		const y = this.$base.y + distanceToA * this.$fy;
		return new Rectangle({ x, y }, { x: x - this.$ox * this.$fx, y: y - this.$oy * this.$fy });
	}
}
