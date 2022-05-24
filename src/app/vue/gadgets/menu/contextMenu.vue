<template>
	<div class="dropdown-menu" @touchend="hide" @mouseup="hide" ref="el" v-if="initialized">
		<slot></slot>
	</div>
</template>

<script lang="ts">
	declare const Popper: typeof popper;
	export default { name: "ContextMenu" };
</script>

<script setup lang="ts">

	import { onMounted, shallowRef } from "vue";

	import Lib from "app/services/libService";

	import type * as popper from "@popperjs/core";

	const el = shallowRef<HTMLDivElement>();
	const initialized = shallowRef(false);

	Lib.ready.then(() => initialized.value = true);

	let shown: boolean = false;

	onMounted(() => {
		const handle = (event: Event): void => {
			if(shown && !el.value!.contains(event.target as Element)) hide();
		};
		document.addEventListener("touchstart", handle, { capture: true, passive: true });
		document.addEventListener("mousedown", handle, { capture: true, passive: true });
	});

	function show(e: MouseEvent): void {
		Popper.createPopper(
			{
				getBoundingClientRect() {
					return {
						top: e.pageY,
						bottom: e.pageY,
						left: e.pageX,
						right: e.pageX,
						width: 0,
						height: 0,
					};
				},
			} as popper.VirtualElement,
			el.value!,
			{
				placement: "bottom-start",
			}
		);
		el.value!.classList.add("show");
		shown = true;
	}

	function hide(): void {
		// 已知設定延遲為 10 在某些版本的 Safari 上面是不夠的，所以安全起見設成 50
		const HIDDEN_DELAY = 50;
		if(shown) {
			// 這邊必須設置一個延遲，否則觸控模式中會不能按
			setTimeout(() => el.value!.classList.remove("show"), HIDDEN_DELAY);
			shown = false;
		}
	}

	defineExpose({ show });

</script>
