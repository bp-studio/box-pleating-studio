<template>
	<div class="browser-only" v-show="fullscreenEnabled">
		<div class="dropdown-item" @click="toggleFullscreen">
			<i class="fas fa-expand" />{{ fullscreen ? $t('toolbar.setting.fullscreenExit') : $t('toolbar.setting.fullscreen')
			}}
		</div>
		<Divider />
	</div>
</template>

<script lang="ts">
	// Safari < 16.4 & on iPad still requires "webkit" prefix,
	// see https://caniuse.com/mdn-api_element_fullscreenchange_event
	// As of today iPhone still has no support for fullscreen.
	// Since the targeted Firefox version is >= 78, we don't need "moz" prefix support here.

	declare global {
		interface Document {
			webkitExitFullscreen?: () => void;
			webkitFullscreenEnabled?: boolean;
			webkitCurrentFullScreenElement?: Element;
		}
		interface Element {
			mozRequestFullScreen?: () => void;
			webkitRequestFullscreen?: () => void;
		}
	}
</script>

<script setup lang="ts">

	import { onMounted, shallowRef } from "vue";

	import Divider from "@/gadgets/menu/divider.vue";

	defineOptions({ name: "Fullscreen" });

	const fullscreen = shallowRef(false);
	const fullscreenEnabled = document.fullscreenEnabled || document.webkitFullscreenEnabled;

	onMounted(() => {
		document.addEventListener("fullscreenchange", checkFullscreen);
		document.addEventListener("webkitfullscreenchange", checkFullscreen);
	});

	function checkFullscreen(): void {
		fullscreen.value = window.matchMedia("(display-mode: fullscreen)").matches ||
			Boolean(document.fullscreenElement || document.webkitCurrentFullScreenElement);
	}

	function toggleFullscreen(): void {
		if(fullscreen.value) {
			const doc = document;
			(doc.exitFullscreen || doc.webkitExitFullscreen).apply(doc);
		} else {
			const el = document.documentElement;
			(el.requestFullscreen || el.webkitRequestFullscreen).apply(el);
		}
	}

</script>
