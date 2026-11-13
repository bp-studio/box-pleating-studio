import "pixi.js/events";
import "pixi.js/filters";
import { GlLimitsSystem, GpuLimitsSystem, autoDetectRenderer, extensions } from "pixi.js";

import type { AutoDetectOptions, ExtensionType, Renderer } from "pixi.js";

type RendererOptions = Omit<Partial<AutoDetectOptions>, "canvas" | "preference">;

/**
 * The maximal time to wait for WebGPU initialization,
 * as `navigator.gpu.requestAdapter()` could hang in some environments.
 */
const WEBGPU_TIMEOUT = 5000;

/**
 * The maximal number of textures in a batch.
 *
 * By default Pixi uses as many as the GPU supports (often 16 or 32), but the
 * fragment shaders then branch over all of them, which is very costly on weak
 * GPUs and in software rendering (making it 2-3 times slower).
 * Very few textures are used in BP Studio (mostly the text labels), so a small
 * number is good enough. (graphics-smooth for Pixi v7 also uses 4.)
 */
const MAX_BATCHABLE_TEXTURES = 4;

interface ILimitsSystem {
	maxBatchableTextures: number;
	contextChange(): void;
}

// A mixin class must have a constructor with a rest parameter of type any[].
type LimitsSystemClass = (new (...args: any[]) => ILimitsSystem) & {
	extension: {
		readonly type: readonly ExtensionType[];
		readonly name: string;
	};
};

/**
 * Systems of lower priorities run later, and the default priority is -1.
 * The limits system has to run after the context system (as it reads the
 * context), and the pipes (which read the limits) always run after all
 * systems.
 */
const LIMITS_PRIORITY = -100;

/** Extends a limits system to cap {@link MAX_BATCHABLE_TEXTURES}. */
function capTextures<T extends LimitsSystemClass>(base: T): T {
	return class extends base {
		public static override extension = {
			...base.extension,
			priority: LIMITS_PRIORITY,
		};

		public override contextChange(): void {
			super.contextChange();
			this.maxBatchableTextures =
				Math.min(this.maxBatchableTextures, MAX_BATCHABLE_TEXTURES);
		}
	};
}

// The renderers are imported dynamically by Pixi, so these are added before
// the default ones, which are then ignored as they have the same names.
extensions.add(capTextures(GlLimitsSystem), capTextures(GpuLimitsSystem));

//=================================================================
/**
 * Creates the renderer, preferring WebGPU and falling back to WebGL.
 *
 * Since Pixi v8 the initialization is async by itself,
 * so there's no more need to break it into async operations manually.
 *
 * We set `skipExtensionImports` and import the extensions we need above,
 * so that the unused ones (such as accessibility) stay out of the bundle.
 *
 * The canvas is created by the renderer, so that an abandoned attempt of
 * WebGPU won't occupy the canvas used by WebGL.
 */
//=================================================================
export async function useRenderer(options: RendererOptions): Promise<Renderer> {
	await scheduler.yield();
	const renderer = await tryWebGPU(options);
	if(renderer) return renderer;
	try {
		return await create(options, "webgl");
	} catch {
		// Neither WebGPU nor WebGL is available.
		return errMgr.setCustomError(
			i18n.t("message.webGL.title"),
			i18n.t("message.webGL.body")
		);
	}
}

function create(
	options: RendererOptions, preference: "webgpu" | "webgl"
): Promise<Renderer> {
	return autoDetectRenderer({
		...options,
		preference: [preference],
		skipExtensionImports: true,
	});
}

/**
 * Pixi doesn't fall back to WebGL if WebGPU is detected but fails to
 * initialize, nor does it time out, so we handle these ourselves.
 */
async function tryWebGPU(options: RendererOptions): Promise<Renderer | null> {
	if(!("gpu" in navigator)) return null;
	const attempt = create(options, "webgpu").catch(() => null);
	const timeout = new Promise<null>(resolve => {
		setTimeout(() => resolve(null), WEBGPU_TIMEOUT);
	});
	const renderer = await Promise.race([attempt, timeout]);
	if(!renderer) {
		// Clean up if the attempt eventually succeeds after timeout.
		attempt.then(r => r?.destroy());
	}
	return renderer;
}
