import { applyTransform } from "../editor";

import type { IEditor, TransformationMatrix } from "../editor";
import type { VertexContainer } from "./vertexContainer";
import type { Tree } from "./tree";

//=================================================================
/**
 * {@link TreeEditor} is the {@link IEditor} for {@link Tree}.
 */
//=================================================================
export class TreeEditor implements IEditor {

	constructor(private readonly _vertices: VertexContainer) { }

	public $transform(matrix: TransformationMatrix): void {
		for(const v of this._vertices) {
			v.$assign(applyTransform(v._location, matrix));
		}
	}
}
