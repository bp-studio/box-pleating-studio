export interface Polygon {
	regions: Point[][];
	inverted: boolean;
}

export type Point = [number, number];

export type Path = Point[];

export type compare = 0 | 1 | -1;
