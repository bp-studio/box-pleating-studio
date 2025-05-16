import { onMounted, readonly, shallowRef } from "vue";

import type Modal from "bootstrap/js/dist/modal";

interface ModalOptions extends Modal.Options {
	onBeforeShow: Action<Awaitable<boolean>>;
}

export default function useModal(screen_name: string, options?: Partial<ModalOptions>) {

	let modal: Modal;

	const el = shallowRef<HTMLDivElement>();
	const on = shallowRef(false);

	onMounted(async () => {
		const $el = el.value!;
		const Modal = (await import("bootstrap/js/dist/modal")).default;
		modal = new Modal($el, options);
		$el.addEventListener("show.bs.modal", () => on.value = true);
		$el.addEventListener("hidden.bs.modal", () => on.value = false);
	});

	async function show(): Promise<void> {
		if(!await (options?.onBeforeShow?.() ?? true)) return;
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
