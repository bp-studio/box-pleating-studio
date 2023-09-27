import { quadrantNumber } from "shared/types/direction";

/**
 * The design of these loops make us traverse all points of Chebyshev distance r.
 */
export function* chebyshev(r: number): Generator<IPoint> {
	for(let i = 0; i < quadrantNumber; i++) {
		for(let j = 0; j < 2 * r; j++) {
			const f = i % 2 ? 1 : -1;
			yield i < 2 ?
				{ x: f * (j - r), y: f * r } :
				{ x: f * r, y: f * (r - j) };
		}
	}
}
