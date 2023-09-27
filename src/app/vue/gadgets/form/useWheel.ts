const DELTA_UNIT = 100;
const WHEEL_THROTTLE = 50;

/** Creates a throttled {@link WheelEvent} handler. */
export function useWheel(callback: Consumer<number>): Consumer<WheelEvent> {
	let lastWheel = performance.now();

	return function(event: WheelEvent): void {
		event.stopPropagation();

		// Throttle to avoid overreacting
		const now = performance.now();
		if(now - lastWheel < WHEEL_THROTTLE) return;
		lastWheel = now;

		const by = Math.round(-event.deltaY / DELTA_UNIT);
		callback(by);
	};
}
