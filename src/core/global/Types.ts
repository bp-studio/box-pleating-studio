import type { Direction } from "./Enums";

//////////////////////////////////////////////////////////////////
// QuadrantDirection
//////////////////////////////////////////////////////////////////

export type QuadrantDirection = Direction.UL | Direction.UR | Direction.LL | Direction.LR;

type PerQuadrantBase<T> = readonly [T, T, T, T];

/** 一個索引只能是 {@link QuadrantDirection} 的唯讀陣列，可以配合 {@link makePerQuadrant} 產生之 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PerQuadrant<T> extends PerQuadrantBase<T> { }

export const quadrantNumber = 4;

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const quadrants: PerQuadrant<QuadrantDirection> = [0, 1, 2, 3];

export const previousQuadrantOffset = 3;
export const nextQuadrantOffset = 1;

export function makePerQuadrant<T>(factory: (q: QuadrantDirection) => T): PerQuadrant<T> {
	return quadrants.map(factory) as unknown as PerQuadrant<T>;
}

export function isQuadrant(direction: Direction): direction is QuadrantDirection {
	return direction < quadrantNumber;
}

export function opposite(direction: QuadrantDirection): QuadrantDirection {
	return (direction + 2) % quadrantNumber;
}

//////////////////////////////////////////////////////////////////
// interfaces
//////////////////////////////////////////////////////////////////

/**
 * {@link ISerializable} 表示一個可以具有 {@link ISerializable.toJSON toJSON()} 方法、可以輸出對應類別的 JSON 物件的類別
 */
export interface ISerializable<T> {
	toJSON(): T;
}
