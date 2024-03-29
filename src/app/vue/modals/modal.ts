import { onMounted, readonly, shallowRef } from "vue";

import Lib from "app/services/libService";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function useModal(screen_name: string, onBeforeShow?: Action<Awaitable<boolean>>) {

	let modal: bootstrap.Modal;

	const el = shallowRef<HTMLDivElement>();
	const on = shallowRef(false);

	onMounted(() => {
		const $el = el.value!;
		modal = new Bootstrap.Modal($el);
		$el.addEventListener("show.bs.modal", () => on.value = true);
		$el.addEventListener("hidden.bs.modal", () => on.value = false);
	});

	async function show(): Promise<void> {
		await Lib.ready;
		if(!await (onBeforeShow?.() ?? true)) return;
		el.value!.addEventListener("shown.bs.modal", () => {
			const bt = getFocusButton();
			if(bt) bt.focus();
		}, { once: true });
		modal.show();
		gtag("event", "screen_view", { screen_name });
	}

	function getFocusButton(): HTMLButtonElement {
		const $el = el.value!;
		return $el.querySelector("[data-bs-dismiss]") as HTMLButtonElement;
	}

	return {
		el,
		on: readonly(on),
		show,
		hide: () => modal.hide(),
	};
}
