<template>
	<div ref="el" v-on:mousedown.stop v-on:touchstart.stop.passive>
		<Welcome />
		<DPad />

		<Panel />
		<Toolbar />

		<ModalFragment />
		<DialogFragment />
	</div>
</template>

<script lang="ts">
	export default { name: "App" };
</script>

<script setup lang="ts">

	import { onMounted, shallowRef } from "vue";

	import Panel from "@/panel/panel.vue";
	import Toolbar from "@/toolbar/toolbar.vue";
	import DPad from "@/gadgets/dpad.vue";
	import Welcome from "@/welcome.vue";
	import DialogFragment from "@/dialogs/dialogFragment.vue";
	import ModalFragment from "@/modals/modalFragment.vue";

	const el = shallowRef<HTMLDivElement>();

	onMounted(() => {
		if(!el.value) return;
		// iPhone 6 不支援 CSS 的 touch-action: none
		if(getComputedStyle(el.value).touchAction != "none") {
			el.value.addEventListener("touchmove", (e: TouchEvent) => {
				if(e.touches.length > 1) e.preventDefault();
			}, { passive: false });
		}
	});

</script>
