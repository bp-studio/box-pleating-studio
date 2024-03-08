import { useThrottle } from "app/utils/timerUtility";

const DELTA_UNIT = 100;
const WHEEL_THROTTLE = 50;
const throttle = useThrottle(WHEEL_THROTTLE);

/** Creates a throttled {@link WheelEvent} handler. */
export function useWheel(callback: Consumer<number>): Consumer<WheelEvent> {
	return function(event: WheelEvent): void {
		event.stopPropagation();
		throttle(() => {
			const by = Math.round(-event.deltaY / DELTA_UNIT);
			callback(by);
		});
	};
}
