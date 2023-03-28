
export enum Direction { UR, UL, LL, LR, R, T, L, B, none }

export type QuadrantDirection = Direction.UL | Direction.UR | Direction.LL | Direction.LR;

export enum SlashDirection { FW, BW }

export const quadrantNumber = 4;

type PerQuadrantBase<T> = readonly [T, T, T, T];

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const quadrants: PerQuadrant<QuadrantDirection> = [0, 1, 2, 3];

/**
 * A readonly array where indices can only be {@link QuadrantDirection}s.
 * Can be generated using {@link makePerQuadrant}.
 */
export interface PerQuadrant<T> extends PerQuadrantBase<T> { }

export function opposite(direction: QuadrantDirection): QuadrantDirection {
	return (direction + 2) % quadrantNumber;
}

export function makePerQuadrant<T>(factory: (q: QuadrantDirection) => T): PerQuadrant<T> {
	return quadrants.map(factory) as unknown as PerQuadrant<T>;
}
