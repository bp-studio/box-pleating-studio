
/**
 * {@link IPoint} is an abstraction of a two dimensional point, without any implementation.
 *
 * For all of our use cases, it is more convenient to have them immutable,
 * so from now the coordinates are both readonly.
 */
interface IPoint {
	readonly x: number;
	readonly y: number;
}

interface IDimension {
	width: number;
	height: number;
}

interface ISignPoint {
	readonly x: Sign;
	readonly y: Sign;
}

type Sign = 0 | 1 | -1;

/**
 * We use this type alias to remind ourselves that certain numbers must be positive.
 */
type Positive = number & { _: undefined } // a trick to make the type distinguishable from just `number`
	| 1; // to make our lives easier
