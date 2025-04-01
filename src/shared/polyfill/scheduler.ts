// Not supported in Safari as of 18.4 and Firefox as of 139

//=================================================================
/**
 * A polyfill for {@link Scheduler.yield} method.
 * https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield
 * https://caniuse.com/mdn-api_scheduler_yield
 *
 * There is also https://github.com/GoogleChromeLabs/scheduler-polyfill
 * but it's way more than what we need.
 * We use that package only for TypeScript definitions.
 */
//=================================================================

const KEY = "scheduler";

const channel = new MessageChannel();
let promise: Promise<void> | undefined;

/**
 * Creates a new macro-task using {@link MessageChannel}-trick.
 * This can break the 4ms-limitation of {@link setTimeout}.
 */
export function doEvents(): Promise<void> {
	// Return existing Promise if available.
	// This helps resolving consecutive callings of this method.
	if(promise) return promise;

	return promise = new Promise(resolve => {
		channel.port1.onmessage = () => {
			promise = undefined;
			resolve();
		};
		channel.port2.postMessage(null);
	});
}

if(!(KEY in self)) {
	Object.defineProperty(self, KEY, {
		value: {
			yield: doEvents,
		},
	});
} else {
	scheduler.yield ||= doEvents;
}
