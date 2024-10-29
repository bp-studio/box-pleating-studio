import { applyTransform } from "../editor";

import type { IEditor, TransformationMatrix } from "../editor";
import type { FlapContainer } from "./flapContainer";
import type { Layout } from "./layout";

//=================================================================
/**
 * {@link LayoutEditor} is the {@link IEditor} for {@link Layout}.
 */
//=================================================================
export class LayoutEditor implements IEditor {

	constructor(private readonly _flaps: FlapContainer) { }

	$transform(matrix: TransformationMatrix): void {
		const [a, b, c, d] = matrix;
		const scale = Math.round((Math.sqrt(a * a + c * c) + Math.sqrt(b * b + d * d)) / 2);
		for(const flap of this._flaps) {
			const { x, y, width, height } = flap.toJSON();
			const ll = applyTransform({ x, y }, matrix);
			const ur = applyTransform({ x: x + width, y: y + height }, matrix);
			const newX = Math.min(ur.x, ll.x);
			const newY = Math.min(ur.y, ll.y);
			const newWidth = Math.abs(ur.x - ll.x);
			const newHeight = Math.abs(ur.y - ll.y);
			flap.$manipulate(newX, newY, newWidth, newHeight);
			flap.radius *= scale;
		}
	}
}
