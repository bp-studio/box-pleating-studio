<template>
	<div class="dropzone" style="display: none;">
		<div class="h2">
			<span v-text="$t('message.dropzone')"/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { onMounted } from "vue";

	import importService from "app/services/importService";

	onMounted(() => {
		const dropzone = document.querySelector(".dropzone") as HTMLDivElement;
		const toggle = (event: Event, drag: boolean): void => {
			event.stopPropagation();
			event.preventDefault();
			dropzone.classList.toggle("drag", drag);
		};
		document.body.addEventListener("dragover", event => toggle(event, true));
		dropzone.addEventListener("dragover", event => event.preventDefault());
		dropzone.addEventListener("dragleave", event => toggle(event, false));
		dropzone.addEventListener("drop", event => {
			if(!event.dataTransfer) return;
			toggle(event, false);
			const files: File[] = [];
			for(let i = 0; i < event.dataTransfer.items.length; i++) {
				const item = event.dataTransfer.items[i];
				if(item.kind == "file") {
					const file = item.getAsFile();
					if(file) files.push(file);
				}
			}
			if(files.length) {
				gtag("event", "dropzone");
				importService.openFiles(files);
			}
		});
	});

</script>

<style lang="scss">
	.dropzone {
		position: fixed;
		z-index: 2000;

		width: 100%;
		height: 100%;
		padding: 1rem;

		background: #8883;

		* {
			/* This is needed to prevent firing dragleave event on child elements. */
			pointer-events: none;
		}

		& > * {
			display: flex;
			align-items: center;
			justify-content: center;

			width: 100%;
			height: 100%;
			border: 5px dashed var(--bs-body-color);

			font-weight: 900;
		}

		&.drag {
			display: block !important;
			/* stylelint-disable-next-line plugin/no-unsupported-browser-features */
			backdrop-filter: blur(5px);
		}

		input {
			cursor: pointer;
			position: absolute;
			inset: 0;
			opacity: 0;
		}
	}
</style>
