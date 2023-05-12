<template>
	<div class="dropdown-menu" @touchend="hide" @mouseup="hide" ref="el" v-if="initialized">
		<slot></slot>
	</div>
</template>

<script lang="ts">
	declare const Popper: typeof popper;
</script>

<script setup lang="ts">

	import { onMounted, shallowRef } from "vue";

	import Lib from "app/services/libService";

	import type * as popper from "@popperjs/core";

	defineOptions({ name: "ContextMenu" });

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
		// A delay of 10 is known to be insufficient on some versions of Safari,
		// so we set it to 50 to be on the safe side
		const HIDDEN_DELAY = 50;
		if(shown) {
			// A delay is required here, or it won't be clickable in touch mode.
			setTimeout(() => el.value!.classList.remove("show"), HIDDEN_DELAY);
			shown = false;
		}
	}

	defineExpose({ show });

</script>
