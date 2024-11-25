<template>
	<div v-on:mousedown.stop v-on:touchstart.stop.passive>
		<Welcome />
		<DPad v-if="phase >= 2" />

		<Panel v-if="phase >= 1" />
		<template v-else>
			<div id="divShade"></div>
			<aside class="scroll-shadow p-3"></aside>
		</template>

		<Toolbar v-if="phase >= 3" />
		<nav class="btn-toolbar p-2" v-else>
			<StubMenu />

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

		<ModalFragment v-if="phase >= 2" />
		<DialogFragment v-if="phase >= 1" />
		<Spinner />
	</div>
</template>

<script setup lang="ts">

	import "shared/polyfill/withResolvers"; // We import this polyfill again for SSG.

	import { phase, asyncComp } from "app/misc/phase"; // This must be loaded before anything else.
	import StubMenu from "@/toolbar/stubMenu.vue";

	defineOptions({ name: "App" });

	// Loading of the following two will directly impact LCP score,
	// so we must load it as fast as possible, but still,
	// we can't afford to load them synchronously with the App itself
	// (that will add too much to TBT), so we use a Scheduler.yield trick here.
	const Welcome = asyncComp(() => import("@/welcome/welcome.vue"), true);
	const Spinner = asyncComp(() => import("@/dialogs/spinner.vue"), true);

	// The rest are loaded in later phase
	const Toolbar = asyncComp(() => import("@/toolbar/toolbar.vue"));
	const Panel = asyncComp(() => import("@/panel/panel.vue"));
	const Status = asyncComp(() => import("@/status.vue"));
	const DPad = asyncComp(() => import("@/gadgets/dpad.vue"));
	const ModalFragment = asyncComp(() => import("@/modals/modalFragment.vue"));
	const DialogFragment = asyncComp(() => import("@/dialogs/dialogFragment.vue"));

</script>
