import { Texture, WRAP_MODES } from "@pixi/core";

/**
 * The size of the texture in pixels, which is also the period of the stripes
 * along the axes. It has to be a power of 2 for the texture to repeat.
 */
const SIZE = 16;

/** The number of channels (RGBA) of each pixel. */
const CHANNELS = 4;

/** The value of all the channels of an opaque white pixel. */
const WHITE = 255;

let texture: Texture | undefined;

/**
 * A repeating white texture of 45-degree stripes alternating with transparent
 * ones, for filling regions with stripes using
 * {@link Graphics.beginTextureFill} (with color tinting).
 *
 * It is created lazily, as it requires the DOM.
 */
export function getStripeTexture(): Texture {
	if(texture) return texture;
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = SIZE;
	const context = canvas.getContext("2d")!;
	const image = context.createImageData(SIZE, SIZE);
	for(let y = 0; y < SIZE; y++) {
		for(let x = 0; x < SIZE; x++) {
			if((x - y + SIZE) % SIZE >= SIZE / 2) continue;
			const i = (y * SIZE + x) * CHANNELS;
			image.data.fill(WHITE, i, i + CHANNELS);
		}
	}
	context.putImageData(image, 0, 0);
	texture = Texture.from(canvas);
	texture.baseTexture.wrapMode = WRAP_MODES.REPEAT;
	return texture;
}
