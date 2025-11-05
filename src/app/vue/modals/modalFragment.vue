<template>
	<template v-if="phase >= 6">
		<Note />
		<Language />
	</template>
	<template v-if="phase >= 7">
		<About :ref="mdlRef('about')" />
		<Version :ref="mdlRef('ver')" />
	</template>
	<template v-if="phase >= 8">
		<Share :ref="mdlRef('share')" />
		<CP :ref="mdlRef('cp')" />
		<template v-if="!HandleService.enabled.value">
			<SVG_ :ref="mdlRef('svg')" />
			<PNG :ref="mdlRef('png')" />
			<BPS :ref="mdlRef('bps')" />
			<BPZ :ref="mdlRef('bpz')" />
		</template>
	</template>
	<template v-if="phase >= 9">
		<Optimizer :ref="mdlRef('optimizer')" />
		<Preference :ref="mdlRef('pref')" />
	</template>
</template>

<script setup lang="ts">

	import HandleService from "app/services/handleService";
	import { phase } from "app/misc/phase";
	import { modals } from "./modals";
	import Share from "./share.vue";
	import About from "./about.vue";
	import Version from "./version.vue";
	import Preference from "./preference.vue";
	import Language from "./language.vue";
	import Note from "./note.vue";
	import CP from "./export/cp.vue";
	import SVG_ from "./export/svg.vue"; // To avoid conflicting with native <svg> tag
	import PNG from "./export/png.vue";
	import BPS from "./export/bps.vue";
	import BPZ from "./export/bpz.vue";
	import Optimizer from "./optimizer.vue";

	import type { IShow } from "./modals";

	defineOptions({ name: "ModalFragment" });

	function mdlRef(key: string): (el: object | null) => void {
		return obj => modals[key] = obj as IShow;
	}

</script>
