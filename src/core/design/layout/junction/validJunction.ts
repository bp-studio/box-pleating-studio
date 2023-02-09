import { Rectangle } from "core/math/rectangle";
import { opposite } from "shared/types/direction";

import type { ITreeNode } from "core/design/context";
import type { QuadrantDirection, SlashDirection } from "shared/types/direction";

interface ValidJunctionData {
	lca: ITreeNode;
	s: IPoint;
	o: IPoint;
	f: IPoint;
	dir: QuadrantDirection;
	tip: IPoint;
}

//=================================================================
/**
 * {@link ValidJunction} 代表一個合法的重疊。
 */
//=================================================================

export class ValidJunction {

	/** 第一個角片 */
	public readonly $a: ITreeNode;

	/** 第二個角片 */
	public readonly $b: ITreeNode;

	public readonly $valid = true;

	/** 兩個角片的 LCA */
	public readonly $lca: ITreeNode;

	/** 斜向 */
	public readonly $slash: SlashDirection;

	/** {@link $a} 對應的象限代碼 */
	public readonly $q1: number;

	/** {@link $b} 對應的象限代碼 */
	public readonly $q2: number;

	/** 角片尖點矩形的尺寸 */
	private readonly _s: Readonly<IPoint>;

	/** 重疊區域的尺寸 */
	private readonly _o: Readonly<IPoint>;

	/** {@link $a} 對應的尖點之所在 */
	private readonly _tip: Readonly<IPoint>;

	/** 對應於 {@link _dir} 的係數 */
	private readonly _f: Readonly<IPoint>;

	/** 所有在幾何上覆蓋自身的 {@link ValidJunction} */
	private readonly _coveredBy: ValidJunction[] = [];

	constructor(a: ITreeNode, b: ITreeNode, data: ValidJunctionData) {
		this.$a = a;
		this.$b = b;

		this.$lca = data.lca;
		this._s = data.s;
		this._o = data.o;
		this._f = data.f;
		this._tip = data.tip;

		const { dir } = data;
		this.$slash = dir % 2;
		this.$q1 = a.id << 2 | dir;
		this.$q2 = b.id << 2 | opposite(dir);
	}

	/**
	 * 自身是否被另外一個 {@link ValidJunction}「實質上」覆蓋。
	 *
	 * 實質覆蓋是比幾何覆蓋進一步的概念：
	 * 如果 A 覆蓋了 B、B 覆蓋了 C，可是 C 了 B 之外並沒有被其它 {@link ValidJunction} 覆蓋，
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
	public $setCoveredBy(that: ValidJunction): void {
		this._coveredBy.push(that);
	}

	/** 清除覆蓋的資訊 */
	public $resetCovering(): void {
		this._coveredBy.length = 0;
		this._isCovered = undefined;
	}

	/** 當比較矩形完全一樣大的時候，比較兩者的遠近 */
	public $isCloserThan(that: ValidJunction): boolean {
		return this._s.x < that._s.x || this._s.y < that._s.y;
	}

	/** 根據指定的距離基準來取得覆蓋比較矩形 */
	public $getBaseRectangle(distanceToA: number): Rectangle {
		const x = this._tip.x + distanceToA * this._f.x;
		const y = this._tip.y + distanceToA * this._f.y;
		return new Rectangle({ x, y }, { x: x - this._o.x * this._f.x, y: y - this._o.y * this._f.y });
	}
}
