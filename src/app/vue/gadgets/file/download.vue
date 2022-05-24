<template>
	<a v-if="!disabled" ref="a" :class="btn ? 'btn btn-primary' : 'dropdown-item'" :href="href" @click="onclick($event)"
	   @contextmenu.stop="onclick($event)" :download="filename + '.' + type" :title="$t('message.downloadHint')">
		<slot></slot>
	</a>
	<div v-else class="dropdown-item disabled" @click.stop>
		<slot></slot>
	</div>
</template>

<script lang="ts">
	export default { name: "Download" };
</script>

<script setup lang="ts">

	import { shallowRef, computed } from "vue";

	import Export from "app/services/exportService";

	const a = shallowRef<HTMLAnchorElement>();
	const href = shallowRef("#");
	const urls: string[] = [];
	let round: number = 0;

	const props = defineProps({
		type: String,
		disabled: Boolean,
		btn: {
			type: Boolean,
			default: false,
		},
	});

	const filename = computed(() => Export.getFilename(props.type!));

	function onclick(event: Event): void {
		if(href.value == "#") event.preventDefault();
	}

	function execute(): void {
		a.value?.click();
	}

	async function getFile(): Promise<void> {
		if(props.disabled) return;
		const r = round;
		href.value = "#";
		const blob = await Export.getBlob(props.type!);
		if(r == round && blob) {
			href.value = URL.createObjectURL(blob);
			urls.push(href.value);
		}
	}

	function reset(): void {
		const ONE_SECOND = 1000;
		round++;
		setTimeout(() => {
			for(const url of urls) URL.revokeObjectURL(url);
			urls.length = 0;
		}, ONE_SECOND);
	}

	defineExpose({ reset, execute, getFile });

</script>
