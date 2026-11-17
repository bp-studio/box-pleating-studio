//=================================================================
/**
 * Evaluates the modules of Pixi in several tasks, to improve TBT.
 *
 * The stage modules are placed in the same chunk as Pixi (see
 * rsbuild.config.ts), so they don't cause additional requests. Stage 0 only
 * loads (and compiles) the chunk without evaluating the modules of Pixi, and
 * each of the other stages evaluates part of them.
 *
 * The client chunk is loaded in parallel in the same way. It is not preloaded
 * in the HTML, so that it won't compete for bandwidth before LCP.
 *
 * This module itself must stay out of the Pixi chunk.
 */
//=================================================================
export async function warmupPixi(): Promise<void> {
	await Promise.all([
		import(/* webpackChunkName: "warmup-0" */ "./load"),
		import(/* webpackChunkName: "client" */ "./client"),
	]);
	await scheduler.yield();
	await import(/* webpackChunkName: "warmup-1" */ "./base");
	await scheduler.yield();
	await import(/* webpackChunkName: "warmup-2" */ "./graphics");
	await scheduler.yield();
	await import(/* webpackChunkName: "warmup-3" */ "./others");
	await scheduler.yield();
}
