
/** All layers and their ordering. */
export enum Layer {
	$sheet,
	$shade,
	$edge,
	$hinge,
	$ridge,
	$axisParallels,
	$junction,
	$dot,
	$vertex,
	$label,
}

export interface ILayerOptions {
	/** Whether this layer should be clipped around the sheet. Default value is `false`. */
	clipped?: boolean;

	/** Whether objects on this layer is interactive. Default value is `false`. */
	interactive?: boolean;
}

/** Settings for each layer. */
export const LayerOptions: Record<Layer, ILayerOptions> = {
	[Layer.$sheet]: {},
	[Layer.$shade]: { clipped: true, interactive: true },
	[Layer.$edge]: { clipped: true, interactive: true },
	[Layer.$hinge]: { clipped: true },
	[Layer.$ridge]: { clipped: true },
	[Layer.$axisParallels]: { clipped: true },
	[Layer.$junction]: { clipped: true },
	[Layer.$dot]: {},
	[Layer.$vertex]: { interactive: true },
	[Layer.$label]: {},
};
