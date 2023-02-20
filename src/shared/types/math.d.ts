
/**
 * {@link IPoint} is an abstraction of a two dimensional point, without any implementation.
 */
interface IPoint {
	x: number;
	y: number;
}

interface IDimension {
	width: number;
	height: number;
}

type Sign = 0 | 1 | -1;
