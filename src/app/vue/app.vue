<template>
	<div ref="el" v-on:mousedown.stop v-on:touchstart.stop.passive>
		<Welcome />
		<DPad v-if="phase >= 2" />

		<Panel v-if="phase >= 2" />
		<template v-else>
			<div id="divShade"></div>
			<aside class="scroll-shadow p-3"></aside>
		</template>

		<Toolbar v-if="phase >= 1" />
		<nav class="btn-toolbar p-2" v-else>
			<div class="btn-group me-2">
				<div class="btn-group">
					<button type="button" disabled class="btn btn-primary dropdown-toggle" aria-label="File">
						<i class="bp-file-alt"></i>
					</button>
				</div>
				<div class="btn-group">
					<button type="button" disabled class="btn btn-primary dropdown-toggle" aria-label="Edit">
						<i class="bp-pencil-ruler"></i>
					</button>
				</div>
				<div class="btn-group">
					<button type="button" disabled class="btn btn-primary dropdown-toggle" aria-label="Settings">
						<i class="bp-tasks"></i>
					</button>
				</div>
				<div class="btn-group">
					<button type="button" disabled class="btn btn-primary dropdown-toggle" aria-label="Tools">
						<i class="bp-tools"></i>
					</button>
				</div>
				<div class="btn-group">
					<button type="button" disabled class="btn btn-primary dropdown-toggle" aria-label="Help">
						<i class="bp-info"></i>
					</button>
				</div>
			</div>

			<div class="btn-group me-2">
				<button type="button" class="btn btn-primary" disabled>
					<i class="bp-tree" />
				</button>
				<button type="button" class="btn btn-primary" disabled>
					<i class="bp-layout" />
				</button>
			</div>
		</nav>

		<Status v-if="phase >= 2" />
		<footer class="py-1 px-3" v-else></footer>

		<ModalFragment v-if="phase >= 1" />
		<DialogFragment />
	</div>
</template>

<script lang="ts">
	export default { name: "App" };
</script>

<script setup lang="ts">

	import { onMounted, shallowRef } from "vue";

	import { phase } from "app/misc/lcpReady"; // This must be loaded before anything else.
	import Panel from "@/panel/panel.vue";
	import Toolbar from "@/toolbar/toolbar.vue";
	import DPad from "@/gadgets/dpad.vue";
	import Welcome from "@/welcome.vue";
	import Status from "@/status.vue";
	import DialogFragment from "@/dialogs/dialogFragment.vue";
	import ModalFragment from "@/modals/modalFragment.vue";

	const el = shallowRef<HTMLDivElement>();

	onMounted(() => {
		if(!el.value) return;
		// iPhone 6 does not support touch-action: none
		if(getComputedStyle(el.value).touchAction != "none") {
			el.value.addEventListener("touchmove", (e: TouchEvent) => {
				if(e.touches.length > 1) e.preventDefault();
			}, { passive: false });
		}
	});

</script>
