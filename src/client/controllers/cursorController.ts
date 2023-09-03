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

	/** Cached cursor position, used for deciding if there's displacement. */
	let location: IPoint = { x: 0, y: 0 };

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

	/** Try update the cursor location and return whether it actually moved. */
	export function $tryUpdate(data: MouseEvent | TouchEvent | IPoint): boolean {
		if(data instanceof Event) data = $getEventCenter(data);
		if(same(location, data)) return false;
		location = data;
		return true;
	}

	/** Returns the displacement since last location, and update location at the same time. */
	export function $diff(event: MouseEvent | TouchEvent): [IPoint, IPoint] {
		const pt = $getEventCenter(event);
		const diff = { x: pt.x - location.x, y: pt.y - location.y };
		return [pt, diff];
	}

	export function $update(pt: IPoint): void {
		location = pt;
	}

	/** Obtain the offset from the given point to the cursor location. */
	export function $offset(pt: IPoint): IPoint {
		return { x: location.x - pt.x, y: location.y - pt.y };
	}
}
