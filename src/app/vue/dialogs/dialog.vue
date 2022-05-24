<template>
	<div class="modal fade modal-second" ref="el">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content" v-if="initialized">
				<div class="modal-body">{{ message }}</div>
				<div class="modal-footer">
					<slot></slot>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	let lastHidden: Promise<void> = Promise.resolve();
	export default { name: "DialogModal" };
</script>

<script setup lang="ts">

	import { onMounted, shallowRef } from "vue";

	import HotkeyService from "app/services/hotkeyService";
	import Lib from "app/services/libService";

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

			// 在開始隱藏的瞬間就直接進行 resolve，以提昇內部執行的效能
			el.value!.addEventListener("hide.bs.modal", () => {
				HotkeyService.unregisterCore(handler);
				resolve();
			}, { once: true });

			// 然而等到隱藏動畫結束之後才允許下一個排程的 dialog 出現
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
