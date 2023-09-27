<template>
	<div class="modal fade modal-second" ref="el">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content" v-if="initialized">
				<div class="modal-body" v-html="message"></div>
				<div class="modal-footer">
					<slot></slot>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	let lastHidden: Promise<void> = Promise.resolve();
</script>

<script setup lang="ts">

	import { onMounted, shallowRef } from "vue";

	import HotkeyService from "app/services/hotkeyService";
	import Lib from "app/services/libService";

	defineOptions({ name: "DialogModal" });

	let modal: bootstrap.Modal;
	const el = shallowRef<HTMLElement>();

	onMounted(() => {
		Lib.ready.then(() => {
			if(!el.value) return;
			modal = new Bootstrap.Modal(el.value, { backdrop: "static" });
		});
	});

	const initialized = shallowRef(false);
	const message = shallowRef<string>();

	async function show(msg: string, key: Func<KeyboardEvent, boolean>, reset?: Action): Promise<void> {
		await Lib.ready;
		initialized.value = true;

		const wait = lastHidden;
		let hidden: Action<Awaitable<void>>;
		lastHidden = new Promise<void>(resolve => { hidden = resolve; });

		await wait;
		message.value = msg;

		return new Promise<void>(resolve => {
			const handler = (e: KeyboardEvent): void => {
				if(key(e)) modal.hide();
			};
			HotkeyService.registerCore(handler);

			// Resolve directly at the moment of hiding to improve the performance of internal execution
			el.value!.addEventListener("hide.bs.modal", () => {
				HotkeyService.unregisterCore(handler);
				resolve();
			}, { once: true });

			// The next scheduled dialog is not allowed to appear until the hidden animation ends
			el.value!.addEventListener("hidden.bs.modal", hidden, { once: true });

			reset?.();
			modal.show();
		});
	}

	defineExpose({
		show,
		hide: () => modal.hide(),
	});

</script>

<style>
	.modal-backdrop + .modal-backdrop {
		z-index: 1061 !important;
	}

	.modal-second {
		z-index: 1062 !important;
	}
</style>
