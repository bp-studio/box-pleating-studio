
//=================================================================
// Enums
//=================================================================

export type Enum<E> = Record<keyof E, number | string> & { [k: number]: string };

export namespace Enum {
	export function values<E extends Enum<E>>(e: E): (E[keyof E])[] {
		return Object
			.values<number>(e as Record<string, number>)
			.filter(a => !isNaN(Number(a))) as (E[keyof E])[];
	}
}

export enum Direction { UR, UL, LL, LR, R, T, L, B, none }

export enum Layer { $sheet, $shade, $hinge, $ridge, $axisParallels, $junction, $dot, $label, $drag }

export interface ILayerOptions {
	clipped: boolean;
	scaled: boolean;
}

export const LayerOptions: { [key: number]: ILayerOptions } = {
	[Layer.$sheet]: { clipped: false, scaled: true },
	[Layer.$shade]: { clipped: true, scaled: true },
	[Layer.$hinge]: { clipped: true, scaled: true },
	[Layer.$ridge]: { clipped: true, scaled: true },
	[Layer.$axisParallels]: { clipped: true, scaled: true },
	[Layer.$junction]: { clipped: true, scaled: true },
	[Layer.$dot]: { clipped: false, scaled: false },
	[Layer.$label]: { clipped: false, scaled: false },
	[Layer.$drag]: { clipped: false, scaled: true },
};
