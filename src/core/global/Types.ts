
//////////////////////////////////////////////////////////////////
// Types
//////////////////////////////////////////////////////////////////

type Action<T = void> = () => T;

type Rational = number | Fraction;

type Sign = 0 | 1 | -1;

//////////////////////////////////////////////////////////////////
// QuadrantDirection
//////////////////////////////////////////////////////////////////

type QuadrantDirection = Direction.UL | Direction.UR | Direction.LL | Direction.LR;

type PerQuadrantBase<T> = readonly [T, T, T, T];

/** 一個索引只能是 {@link QuadrantDirection} 的唯讀陣列，可以配合 {@link makePerQuadrant} 產生之 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface PerQuadrant<T> extends PerQuadrantBase<T> { }

const quadrantNumber = 4;

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const quadrants: PerQuadrant<QuadrantDirection> = [0, 1, 2, 3];

const previousQuadrantOffset = 3;
const nextQuadrantOffset = 1;

function makePerQuadrant<T>(factory: (q: QuadrantDirection) => T): PerQuadrant<T> {
	return quadrants.map(factory) as unknown as PerQuadrant<T>;
}

function isQuadrant(direction: Direction): direction is QuadrantDirection {
	return direction < quadrantNumber;
}

function opposite(direction: QuadrantDirection): QuadrantDirection {
	return (direction + 2) % quadrantNumber;
}
