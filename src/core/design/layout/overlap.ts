import type { ITreeNode } from "../context";

//=================================================================
/**
 * {@link Overlap} 負責計算兩個角片之間的合法重疊狀態。
 */
//=================================================================

export class Overlap {

	public readonly $a: ITreeNode;
	public readonly $b: ITreeNode;
	public readonly $sx: number = 0;
	public readonly $sy: number = 0;
	public readonly $dist: number;
	public readonly $valid: boolean = false;

	/** 同樣的非法重疊是否已經被繪製過了 */
	public $processed: boolean = false;

	constructor(a: ITreeNode, b: ITreeNode, d: number) {
		if(a.id > b.id) [a, b] = [b, a];
		this.$a = a;
		this.$b = b;
		this.$dist = d;
		const [t1, r1, b1, l1] = a.$AABB.$toValues();
		const [t2, r2, b2, l2] = b.$AABB.$toValues();
		const x = Math.max(l1 - r2, l2 - r1);
		const y = Math.max(b1 - t2, b2 - t1);
		if(x <= 0 || y <= 0) return;
		if(x * x + y * y < d * d) return;
		this.$valid = true;
		this.$sx = x;
		this.$sy = y;
	}
}
