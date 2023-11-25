import type { NodeId } from "shared/json";

export enum Direction { UR, UL, LL, LR, R, T, L, B, none }

export type QuadrantDirection = Direction.UL | Direction.UR | Direction.LL | Direction.LR;

export enum SlashDirection { FW, BW }

export const quadrantNumber = 4;

type PerQuadrantBase<T> = [T, T, T, T];

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const quadrants = perQuadrant([0, 1, 2, 3]);

export const previousQuadrantOffset = 3;
export const nextQuadrantOffset = 1;

/**
 * A readonly array where indices can only be {@link QuadrantDirection}s.
 * Can be generated using {@link makePerQuadrant}.
 */
export interface PerQuadrant<T> extends PerQuadrantBase<T> {
	map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: PerQuadrant<T>): PerQuadrant<U>;
}

export function perQuadrant<T>(args: PerQuadrantBase<T>): PerQuadrant<T> {
	return args as PerQuadrant<T>;
}

export function opposite(direction: QuadrantDirection): QuadrantDirection {
	return (direction + 2) % quadrantNumber;
}

export function makePerQuadrant<T>(factory: (q: QuadrantDirection) => T): PerQuadrant<T> {
	return quadrants.map(factory);
}

export type QuadrantCode = TypedNumber<"QuadrantCode">;

const QUADRANT_MASK = 3;

export function getNodeId(code: QuadrantCode): NodeId {
	return code >>> 2 as NodeId;
}

export function getQuadrant(code: QuadrantCode): QuadrantDirection {
	return code & QUADRANT_MASK;
}

export function makeQuadrantCode(id: NodeId, q: QuadrantDirection): QuadrantCode {
	return (id << 2 | q) as QuadrantCode;
}
