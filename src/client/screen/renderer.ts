import "pixi.js/events";
import "pixi.js/filters";
import {
	GlLimitsSystem, GpuLimitsSystem, autoDetectRenderer, extensions,
	isWebGLSupported
} from "pixi.js";

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
		return await createWebGL(options);
	} catch(e) {
		// Neither WebGPU nor WebGL is available.
		failures.push("WebGL: " + reason(e));
		if(!/bot|crawl|spider/i.test(navigator.userAgent)) {
			gtag("event", "webgl_unavailable", gaErrorData(failures.join("; ")));
		}
		return errMgr.setCustomError(
			i18n.t("message.webGL.title"),
			errorBody()
		);
	}
}

/** The reasons of the failed attempts, for diagnosis. */
const failures: string[] = [];

function reason(e: unknown): string {
	const message = e instanceof Error ? e.message : String(e);
	return message || "unknown error";
}

function escapeHTML(text: string): string {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * The message shown when neither WebGPU nor WebGL is available. In particular,
 * this happens when GPU acceleration is disabled or blocked in the browser.
 */
function errorBody(): string {
	const tips = [
		i18n.t("message.webGL.tips.accel"),
		i18n.t("message.webGL.tips.gpuPage", [
			"<code>chrome://gpu</code>",
			"<code>about:support</code>",
		]),
		i18n.t("message.webGL.tips.linux"),
		i18n.t("message.webGL.tips.driver"),
	];
	const diagnosis = [
		"Build number: " + app_config.app_version,
		navigator.userAgent,
		...failures,
	];
	return i18n.t("message.webGL.body") +
		`<ul class="mt-2">${tips.map(t => `<li>${t}</li>`).join("")}</ul>` +
		`${i18n.t("message.webGL.diagnosis")}<br>` +
		diagnosis.map(escapeHTML).join("<br>");
}

function create(
	options: RendererOptions, preference: "webgpu" | "webgl",
	extra?: Partial<AutoDetectOptions>
): Promise<Renderer> {
	return autoDetectRenderer({
		...options,
		...extra,
		preference: [preference],
		skipExtensionImports: true,
	});
}

/**
 * Creating a WebGL context is costly, and Pixi does it twice (once for
 * detecting the support) in the same task as the rest of the initialization.
 * To improve TBT, we do these in separate tasks, and pass the context to Pixi.
 */
async function createWebGL(options: RendererOptions): Promise<Renderer> {
	// The result is cached by Pixi, so it won't be done again.
	if(!isWebGLSupported()) throw new Error("WebGL is not supported");
	await scheduler.yield();

	// Same as the attributes used by Pixi, see GlContextSystem.init().
	const attributes: WebGLContextAttributes = {
		alpha: false, // The background is opaque
		premultipliedAlpha: options.premultipliedAlpha ?? true,
		antialias: options.antialias,
		stencil: true,
		preserveDrawingBuffer: false,
		powerPreference: "default",
	};
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("webgl2", attributes);
	// Let Pixi handle it if WebGL 2 is not available.
	if(!context) return create(options, "webgl");
	await scheduler.yield();

	return create(options, "webgl", { canvas, context });
}

/**
 * Pixi doesn't fall back to WebGL if WebGPU is detected but fails to
 * initialize, nor does it time out, so we handle these ourselves.
 */
async function tryWebGPU(options: RendererOptions): Promise<Renderer | null> {
	if(!("gpu" in navigator)) {
		failures.push("WebGPU: not supported");
		return null;
	}
	let settled = false;
	const attempt = create(options, "webgpu")
		.catch((e: unknown) => {
			failures.push("WebGPU: " + reason(e));
			return null;
		})
		.finally(() => {
			settled = true;
		});
	const timeout = new Promise<null>(resolve => {
		setTimeout(() => resolve(null), WEBGPU_TIMEOUT);
	});
	const renderer = await Promise.race([attempt, timeout]);
	if(!renderer) {
		if(!settled) failures.push("WebGPU: timed out");
		// Clean up if the attempt eventually succeeds after timeout.
		attempt.then(r => r?.destroy());
	}
	return renderer;
}
