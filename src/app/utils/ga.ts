import { useThrottle } from "./timerUtility";

const throttles = new Map<string, Action>();

export function useThrottledGA(eventName: string, time: number): Action {
	let action = throttles.get(eventName);
	if(!action) {
		const throttle = useThrottle(time);
		action = () => throttle(() => gtag("event", eventName));
		throttles.set(eventName, action);
	}
	return action;
}
