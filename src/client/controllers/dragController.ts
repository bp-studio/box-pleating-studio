import { shallowRef } from "vue";

import Interaction from "client/services/interaction";

import type { DirectionKey } from "shared/types/types";

namespace DragController {
	export const isDragging = shallowRef(false);

	export function dragByKey(key: DirectionKey): void {
		let v: IPoint;
		switch(key) {
			case "up": v = { x: 0, y: 1 }; break;
			case "down": v = { x: 0, y: -1 }; break;
			case "left": v = { x: -1, y: 0 }; break;
			case "right": v = { x: 1, y: 0 }; break;
			default: return;
		}

		const selections = Interaction.draggables.value;

		for(const d of selections) {
			d.$location.x += v.x;
			d.$location.y += v.y;
		}
	}
}

export default DragController;
