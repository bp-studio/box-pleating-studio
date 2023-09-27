import { dist, same } from "shared/types/geometry";
import { $getEventCenter } from "./share";

interface Displacement {
	downPoint: IPoint;
	point: IPoint;
	dist: number;
}

//=================================================================
/**
 * {@link CursorController} manages the cursor location.
 */
//=================================================================

export namespace CursorController {

	/** MouseDown or TouchStart location. */
	let downPoint: IPoint;

	/** Cursor location in floating numbers. */
	let location: IPoint = { x: 0, y: 0 };

	/** Cursor coordinates in integers. */
	let coordinate: IPoint = { x: 0, y: 0 };

	export function $setDown(event: MouseEvent | TouchEvent): void {
		downPoint = $getEventCenter(event);
	}

	export function $getDown(): IPoint {
		return downPoint;
	}

	export function $displacement(event: MouseEvent | TouchEvent): Displacement {
		const point = $getEventCenter(event);
		return {
			downPoint,
			point,
			dist: dist(downPoint, point),
		};
	}

	/** Update {@link location}. */
	export function $update(pt: IPoint): void {
		location = pt;
	}

	/** Returns the displacement since last {@link location}, and update location at the same time. */
	export function $diff(event: MouseEvent | TouchEvent): [IPoint, IPoint] {
		const pt = $getEventCenter(event);
		const diff = { x: pt.x - location.x, y: pt.y - location.y };
		return [pt, diff];
	}

	/** Try update the cursor {@link coordinate} and return whether it actually moved. */
	export function $tryUpdate(pt: IPoint): boolean {
		if(same(coordinate, pt)) return false;
		coordinate = pt;
		return true;
	}

	/** Obtain the offset from the given point to the cursor {@link coordinate}. */
	export function $offset(pt: IPoint): IPoint {
		return { x: coordinate.x - pt.x, y: coordinate.y - pt.y };
	}
}
