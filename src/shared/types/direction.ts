
export enum Direction { UR, UL, LL, LR, R, T, L, B, none }

export type QuadrantDirection = Direction.UL | Direction.UR | Direction.LL | Direction.LR;

export enum SlashDirection { FW, BW }

export const quadrantNumber = 4;

export function opposite(direction: QuadrantDirection): QuadrantDirection {
	return (direction + 2) % quadrantNumber;
}
