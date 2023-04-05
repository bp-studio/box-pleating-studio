<template>
	<template v-if="stage >= 1">
		<Note />
		<Language />
	</template>
	<template v-if="stage >= 2">
		<About :ref="mdlRef('about')" />
		<Version :ref="mdlRef('ver')" />
	</template>
	<template v-if="stage >= 3">
		<Share :ref="mdlRef('share')" />
		<CP :ref="mdlRef('cp')" />
		<template v-if="!isFileApiEnabled">
			<SVG_ :ref="mdlRef('svg')" />
			<PNG :ref="mdlRef('png')" />
			<BPS :ref="mdlRef('bps')" />
			<BPZ :ref="mdlRef('bpz')" />
		</template>
	</template>
	<template v-if="stage == 4">
		<Preference :ref="mdlRef('pref')" />
	</template>
</template>

<script lang="ts">
	const modals: Record<string, IShow> = {};
	export async function show(key: string): Promise<void> {
		(await getModal(key)).show();
	}

	/** Just in case the modal is called too early. */
	function getModal(key: string): Promise<IShow> {
		return new Promise(resolve => {
			if(modals[key]) resolve(modals[key]);
			const int = setInterval(() => {
				if(modals[key]) {
					clearInterval(int);
					resolve(modals[key]);
				}
			}, 1);
		});
	}

	export default { name: "ModalFragment" };
</script>

<script setup lang="ts">

	import { shallowRef } from "vue";

	import { doEvents } from "shared/utils/async";
	import { isFileApiEnabled } from "app/shared/constants";
	import Lib from "app/services/libService";
	import Share from "./share.vue";
	import About from "./about.vue";
	import Version from "./version.vue";
	import Preference from "./preference.vue";
	import Language from "./language.vue";
	import Note from "./note.vue";
	import CP from "./cp.vue";
	import SVG_ from "./svg.vue"; // To avoid conflicting with native <svg> tag
	import PNG from "./png.vue";
	import BPS from "./bps.vue";
	import BPZ from "./bpz.vue";

	const stage = shallowRef(0); // To prevent long task
	Lib.ready.then(async () => {
		stage.value = 1;
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		while(stage.value < 4) {
			// eslint-disable-next-line no-await-in-loop
			await doEvents();
			stage.value++;
		}
	});

	function mdlRef(key: string): (el: object | null) => void {
		return obj => modals[key] = obj as IShow;
	}

</script>
