import { shallowRef } from "vue";

const DURATION = 3000;

let timeout: ReturnType<typeof setTimeout> | undefined;

//=================================================================
/**
 * {@link ToastService} shows brief messages that disappear automatically.
 */
//=================================================================
namespace ToastService {

	/**
	 * The last message shown. It is kept after hiding,
	 * so that it remains visible while fading out.
	 */
	export const message = shallowRef("");

	export const visible = shallowRef(false);

	export function show(msg: string): void {
		message.value = msg;
		visible.value = true;
		clearTimeout(timeout);
		timeout = setTimeout(() => visible.value = false, DURATION);
	}
}

export default ToastService;
