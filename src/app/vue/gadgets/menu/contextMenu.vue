<template>
	<div class="dropdown-menu" @touchend="tap" @mouseup="tap" ref="el" v-if="initialized">
		<slot></slot>
	</div>
</template>

<script setup lang="ts">

	import { onMounted, shallowRef } from "vue";

	import type { Instance } from "@popperjs/core";

	defineOptions({ name: "ContextMenu" });

	const el = shallowRef<HTMLDivElement>();
	const initialized = shallowRef(false);

	import("@popperjs/core").then(() => initialized.value = true);

	let shown: boolean = false;
	let popper: Instance;

	onMounted(() => {
		const handle = (event: Event): void => {
			if(shown && !el.value!.contains(event.target as Element)) hide();
		};
		document.addEventListener("touchstart", handle, { capture: true, passive: true });
		document.addEventListener("mousedown", handle, { capture: true, passive: true });
	});

	async function show(e: MouseEvent): Promise<void> {
		const Popper = await import("@popperjs/core");
		popper = Popper.createPopper(
			{ getBoundingClientRect: () => new DOMRect(e.pageX, e.pageY) },
			el.value!,
			{ placement: "bottom-start" }
		);
		el.value!.classList.add("show");
		shown = true;
	}

	function hideCore(): void {
		el.value!.classList.remove("show");
	}

	function hide(): void {
		if(shown) {
			hideCore();
			popper.destroy();
			shown = false;
		}
	}

	function tap(): void {
		// A delay of 10 is known to be insufficient on some versions of Safari,
		// so we set it to 50 to be on the safe side
		const HIDDEN_DELAY = 50;
		if(shown) {
			// A delay is required here, or it won't be clickable in touch mode.
			setTimeout(hideCore, HIDDEN_DELAY);
			popper.destroy();
			shown = false;
		}
	}

	defineExpose({ show });

</script>
