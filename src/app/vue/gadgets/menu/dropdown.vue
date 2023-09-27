<template>
	<div class="btn-group" ref="el" @mouseenter.once="init" @touchstart.once.passive="init">
		<button ref="btn" type="button" @mouseenter="mouseenter" :title="title" :disabled="!Studio.initialized"
				class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" :aria-label="label">
			<i :class="icon" />
			<div class="notify" v-if="notify"></div>
		</button>
		<!--We display the content of the dropdown menu only
			after initialization to improve startup performance. -->
		<div ref="menu" class="dropdown-menu" v-if="initialized">
			<slot></slot>
		</div>
	</div>
</template>

<script lang="ts">
	const dropdown = {
		current: null as symbol | null,
		skipped: false,
	};
</script>

<script setup lang="ts">

	import { shallowRef } from "vue";

	import Studio from "app/services/studioService";
	import Lib from "app/services/libService";

	defineOptions({ name: "Dropdown" });

	defineProps<{
		icon: string;
		title: string;
		notify?: boolean;
		label?: string;
	}>();

	const emit = defineEmits(["show", "hide"]);

	const initialized = shallowRef(false);
	const self = Symbol("dropdown");

	const el = shallowRef<HTMLDivElement>();
	const btn = shallowRef<HTMLButtonElement>();
	const menu = shallowRef<HTMLDivElement>();

	function init(): void {
		if(initialized.value) return;
		initialized.value = true;
		Lib.ready.then(() => {
			const dd = new Bootstrap.Dropdown(btn.value!, {});

			// Bootstrap doesn't support touch cancel
			document.addEventListener("touchstart", event => {
				if(!menu.value!.contains(event.target as Element)) dd.hide();
			}, { capture: true, passive: true });

			const $el = el.value!;
			$el.addEventListener("show.bs.dropdown", () => emit("show"));
			$el.addEventListener("shown.bs.dropdown", () => dropdown.current = self);
			$el.addEventListener("hide.bs.dropdown", () => {
				if(!dropdown.skipped) dropdown.current = null;
				dropdown.skipped = false;
			});
			$el.addEventListener("hidden.bs.dropdown", () => emit("hide"));
		});
	}

	function mouseenter(): void {
		if(dropdown.current && dropdown.current != self) {
			dropdown.skipped = true;
			btn.value!.click();
		}
	}

	// We also allow manual triggering initialization
	defineExpose({ init });

</script>
