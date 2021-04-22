
//////////////////////////////////////////////////////////////////
// Types
//////////////////////////////////////////////////////////////////

type Action = () => void;

type Rational = number | Fraction;

type Sign = 0 | 1 | -1;

//////////////////////////////////////////////////////////////////
// QuadrantDirection
//////////////////////////////////////////////////////////////////

type QuadrantDirection = Direction.UL | Direction.UR | Direction.LL | Direction.LR;

type PerQuadrantBase<T> = readonly [T, T, T, T];

/** 一個索引只能是 `QuadrantDirection` 的唯讀陣列，可以配合 `MakePerQuadrant` 產生之 */
interface PerQuadrant<T> extends PerQuadrantBase<T> { }

const quadrants: PerQuadrant<QuadrantDirection> = [0, 1, 2, 3];

function MakePerQuadrant<T>(factory: (q: QuadrantDirection) => T): PerQuadrant<T> {
	return quadrants.map(factory) as unknown as PerQuadrant<T>;
}

function isQuadrant(direction: Direction): direction is QuadrantDirection {
	return direction < 4;
}

function opposite(direction: QuadrantDirection): QuadrantDirection {
	return (direction + 2) % 4;
}
