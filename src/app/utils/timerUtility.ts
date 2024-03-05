
/**
 * Returns a debounce executor that runs after the given time, but gets override if called again.
 */
export function useDebounce(time: number): Consumer<Action> {
	let debounce: number;
	return (action: Action) => {
		if(debounce) clearTimeout(debounce);
		debounce = setTimeout(action, time);
	};
}

/**
 * Returns a throttle executor that will only run once within the given time frame.
 */
export function useThrottle(time: number): Consumer<Action> {
	let lastTriggered = 0;
	return (action: Action) => {
		const now = performance.now();
		if(now - lastTriggered < time) return; // no "trailing" here
		lastTriggered = now;
		action();
	};
}
