<template>
	<template v-if="initialized">
		<Share :ref="mdlRef('share')" />
		<About :ref="mdlRef('about')" />
		<Version :ref="mdlRef('ver')" />
		<Preference :ref="mdlRef('pref')" />
		<CP :ref="mdlRef('cp')" />
		<Note />
		<Language />
	</template>
</template>

<script lang="ts">
	const modals: Record<string, IShow> = {};
	export function show(key: string): void {
		modals[key]?.show();
	}
	export default { name: "ModalFragment" };
</script>

<script setup lang="ts">

	import { shallowRef } from "vue";

	import Lib from "app/services/libService";
	import Share from "./share.vue";
	import About from "./about.vue";
	import Version from "./version.vue";
	import Preference from "./preference.vue";
	import Language from "./language.vue";
	import Note from "./note.vue";
	import CP from "./cp.vue";

	const initialized = shallowRef(false);
	Lib.ready.then(() => initialized.value = true);

	function mdlRef(key: string): (el: object | null) => void {
		return obj => modals[key] = obj as IShow;
	}

</script>
