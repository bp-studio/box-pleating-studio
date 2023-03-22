
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
