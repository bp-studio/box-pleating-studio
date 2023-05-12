<template>
	<template v-if="phase >= 3">
		<Note />
		<Language />
	</template>
	<template v-if="phase >= 4">
		<About :ref="mdlRef('about')" />
		<Version :ref="mdlRef('ver')" />
	</template>
	<template v-if="phase >= 5">
		<Share :ref="mdlRef('share')" />
		<CP :ref="mdlRef('cp')" />
		<template v-if="!isFileApiEnabled">
			<SVG_ :ref="mdlRef('svg')" />
			<PNG :ref="mdlRef('png')" />
			<BPS :ref="mdlRef('bps')" />
			<BPZ :ref="mdlRef('bpz')" />
		</template>
	</template>
	<template v-if="phase >= 6">
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
</script>

<script setup lang="ts">

	import { isFileApiEnabled } from "app/shared/constants";
	import { phase } from "app/misc/lcpReady";
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

	defineOptions({ name: "ModalFragment" });

	function mdlRef(key: string): (el: object | null) => void {
		return obj => modals[key] = obj as IShow;
	}

</script>
