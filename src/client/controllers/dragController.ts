import { shallowRef } from "vue";

import { SelectionController } from "./selectionController";

namespace DragController {
	export const isDragging = shallowRef(false);

	export function dragByKey(key: string): void {
		let v: IPoint;
		switch(key) {
			case "up": v = { x: 0, y: 1 }; break;
			case "down": v = { x: 0, y: -1 }; break;
			case "left": v = { x: -1, y: 0 }; break;
			case "right": v = { x: 1, y: 0 }; break;
			default: return;
		}

		const selections = SelectionController.draggables.value;

		for(const d of selections) {
			d.$location.x += v.x;
			d.$location.y += v.y;
		}
	}
}

export default DragController;
