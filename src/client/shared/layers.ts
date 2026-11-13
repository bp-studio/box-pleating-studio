import { Container } from "pixi.js";

import { Enum } from "client/shared/enum";

/** All layers and their ordering. */
export enum Layer {
	uncovered,
	sheet,
	shade,
	edge,
	hinge,
	ridge,
	axisParallels,
	junction,
	issue,
	dot,
	vertex,
	label,
}

interface ILayerOptions {
	/**
	 * Whether this layer should be clipped around the sheet. Default value is
	 * `false`.
	 */
	clipped?: boolean;

	/**
	 * Whether objects on this layer is interactive. Default value is `false`.
	 */
	interactive?: boolean;
}

/** Settings for each layer. */
export const LayerOptions: Record<Layer, ILayerOptions> = {
	[Layer.uncovered]: { clipped: true },
	[Layer.sheet]: {},
	[Layer.shade]: { clipped: true, interactive: true },
	[Layer.edge]: { clipped: true, interactive: true },
	[Layer.hinge]: { clipped: true },
	[Layer.ridge]: { clipped: true },
	[Layer.axisParallels]: { clipped: true },
	[Layer.junction]: { clipped: true },
	[Layer.issue]: {},
	[Layer.dot]: {},
	[Layer.vertex]: { interactive: true },
	[Layer.label]: {},
};

/**
 * Create the layers and add them to the view.
 *
 * Consecutive clipped layers are grouped to share one mask,
 * as each mask is quite costly in Pixi v8,
 * especially on devices with weak GPUs.
 */
export function createLayers(view: Container, mask: Container): Container[] {
	const layers: Container[] = [];
	let clippedGroup: Container | null = null;
	for(const layer of Enum.values(Layer)) {
		const container = new Container();
		layers[layer] = container;
		const options = LayerOptions[layer];
		if(!options.interactive) container.interactiveChildren = false;
		if(options.clipped) {
			if(!clippedGroup) {
				clippedGroup = new Container();
				clippedGroup.mask = mask;
				view.addChild(clippedGroup);
			}
			clippedGroup.addChild(container);
		} else {
			clippedGroup = null;
			view.addChild(container);
		}
	}
	return layers;
}
