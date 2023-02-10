import type { QuadrantDirection } from "shared/types/direction";
import type { CornerType } from "./enum";

export interface JQuadrilateral {
	/** 這個 {@link JQuadrilateral} 的四個象限角；方向是根據相位變換之前 */
	c: JCorner[];

	ox: number;
	oy: number;
}

//=================================================================
/**
 * {@link JOverlap} 是 {@link Configuration} 的基本構成元素，
 * 是一個從 {@link JJunction} 中切割得到的區域。
 *
 * 基本的情況中它代表著一個矩形重疊區域，不過在使用 join 的情況中，
 * 它可能會變形成隨意的四邊形，但是總之它不管怎樣都有四個象限角。
 */
//=================================================================

export interface JOverlap extends JQuadrilateral {

	/** 這個 {@link JOverlap} 是從哪一個 {@link JJunction} 切割出來的 */
	parent: number;

	/** 切割時相對於 parent 的 p[0] 角落（右上角）的正規偏移，省略則等於 (0,0) */
	shift?: IPoint;
}

//=================================================================
/**
 * {@link JCorner} 是 {@link JQuadrilateral} 的一個象限角。
 *
 * 它同時負責描述這個角落的自身狀態以及連接對象；它繼承了 {@link Partial}<{@link JConnection}> 介面，
 * 如果其 e, q 為 undefined 表示它沒有連出。
 */
//=================================================================

export interface JCorner extends Partial<JConnection> {

	/** 角落型態 */
	type: CornerType;

	/**
	 * 這是預備未來複雜分割使用。
	 * 當有三個或四個 Overlap 的頂點重合於一處時，其中的側點會呈現機動式的行為；
	 * 為了讓這樣的狀態比較容易表示，我們將那兩個側點設定 type 為 none，
	 * 然後在連出的頂點上註記上該兩個側點。
	 * 實際繪製的時候會根據哪一個側點比較接近來實現機動行為
	 */
	joint?: [JConnection, JConnection];
}

//=================================================================
/**
 * {@link JConnection} 介面表示一個連接關係
 */
//=================================================================

export interface JConnection {

	/** 連接對象，非負數代表 {@link Flap}，負數代表 {@link Overlap}（在整個 {@link Configuration} 中的 id） */
	e: number;

	/** 連接至對方的哪一個象限角；{@link Flap} 的情況是原始的，{@link Overlap} 的情況是未經相位變換的 */
	q: QuadrantDirection;
}
