import { ContextSystem, Renderer, StartupSystem, getTestContext } from "@pixi/core";

import { doEvents } from "shared/utils/async";

import type { IRendererOptions, ContextSystemOptions, IRenderingContext, StartupSystemOptions } from "@pixi/core";

//=================================================================
/**
 * The native startup routine of Pixi.js will result in a really long
 * task, cause lots of TBT. To solve this issue, we use many tricks
 * here to break the routine into several async operations.
 */
//=================================================================
export async function useRenderer(options: Partial<IRendererOptions>): Promise<Renderer> {
	const contextSystem = new AsyncContextSystem({
		background: {
			alpha: 1,
		},
		view: options.view,
	} as Renderer);

	try {
		contextSystem.init(options as ContextSystemOptions);
		// eslint-disable-next-line require-atomic-updates
		options.context = await contextSystem.$context;
	} catch(_) {
		errMgr.setCustomError(
			i18n.t("message.webGL.title"),
			i18n.t("message.webGL.body")
		);
	}

	await doEvents();
	getTestContext();
	await doEvents();

	// Create renderer. When context is given in the options,
	// For some reason it won't run the getExtensions() method,
	// so we use the AsyncContextSystem to capture the extensions
	// earlier, and inject them back here.
	const renderer = new Renderer(options);
	renderer.context.extensions = contextSystem.extensions;
	await StartupPromise;
	await doEvents();

	return renderer;
}

/**
 * Patch {@link StartupSystem} to make it async.
 */
let StartupPromise: Promise<void>;
const oldRun = StartupSystem.prototype.run;
const oldResize = Renderer.prototype.resize;
StartupSystem.prototype.run = function(options: StartupSystemOptions): void {
	StartupPromise = doEvents().then(() => {
		oldRun.call(this, options);
		Renderer.prototype.resize = oldResize; // Restore resize functionality.
	});
};
Renderer.prototype.resize = () => {
	// Skip the first resize calling.
};

/**
 * Extend {@link ContextSystem} to make it async.
 */
class AsyncContextSystem extends ContextSystem {

	public $context!: Promise<IRenderingContext>;

	protected override getExtensions(): void {
		this.$context = doEvents().then(() => {
			super.getExtensions();
			return this.gl;
		});
	}

	public override initFromContext(gl: IRenderingContext): void {
		// Do nothing
	}
}
