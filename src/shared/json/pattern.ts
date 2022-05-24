import type { Strategy } from "./enum";
import type { JOverlap, JQuadrilateral } from "./layout";

export interface JStretch {
	id: string;

	/** 如果找不到 {@link Pattern} 就會是 undefined */
	configuration?: JConfiguration;

	/** 如果找不到 {@link Pattern} 就會是 undefined */
	pattern?: JPattern;
}

export interface JConfiguration {
	/** 這個 Configuration 裡面所有的 Partition */
	partitions: readonly JPartition[];
	patterns?: JPattern[];
	index?: number;
}

export interface JJunction extends JQuadrilateral {
	/** 對應的兩個 {@link Flap} 之間的最大空間，恆正 */
	sx: number;
}

export interface JPartition {
	/** 這個 Partition 裡面所有的 Overlap */
	overlaps: readonly JOverlap[];

	/** 這個 Partition 採用的生成策略 */
	strategy?: Strategy;
}

export type JStructure = readonly Readonly<JJunction>[];

export interface JPattern<T extends JGadget = JGadget> {
	devices: readonly JDevice<T>[];
}

export interface JDevice<T extends JGadget = JGadget> {
	gadgets: T[];
	offset?: number;
	addOns?: readonly JAddOn[];
}

export interface JAddOn {
	contour: IPoint[];
	dir: IPoint;
}

export interface JGadget {

	/** 所有組成當前 {@link Gadget} 的 {@link Piece} */
	pieces: JPiece[];

	/** 這個 {@link Gadget} 相對於其第一個 {@link Piece} 的 p[0] 的位移植 */
	offset?: IPoint;

	anchors?: JAnchor[];
}

export interface JAnchor {
	/** 連接時要保留的間隙 */
	slack?: number;

	/** 自訂這個 Anchor 的位置，如果不指定，會直接根據 Gadget 來推算 */
	location?: IPoint;
}

export interface JPiece {
	ox: number;
	oy: number;
	u: number;
	v: number;

	/** 繞道，沿著順時鐘方向運行；其座標都是沒有加上 shift 之前的 */
	detours?: IPoint[][];

	/**
	 * 這個 Piece 相對於 Partition 的參考原點的（相位變換前）偏移。
	 *
	 * 這包括了非整數解的偏移，或是較複雜的 join 中的偏移
	 */
	shift?: IPoint;
}
