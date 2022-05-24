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
	declare global {
		interface Document {
			webkitExitFullscreen?: () => void;
			mozCancelFullScreen?: () => void;
			webkitFullscreenEnabled?: boolean;
			webkitCurrentFullScreenElement?: Element;
			mozFullscreenEnabled?: boolean;
			mozFullScreenElement?: Element;
		}
		interface Element {
			mozRequestFullScreen?: () => void;
			webkitRequestFullscreen?: () => void;
		}
	}
	export default { name: "Fullscreen" };
</script>

<script setup lang="ts">

	import { shallowRef } from "vue";

	import Divider from "@/gadgets/menu/divider.vue";

	const fullscreen = shallowRef(false);
	const fullscreenEnabled = document.fullscreenEnabled ||
		document.mozFullscreenEnabled || document.webkitFullscreenEnabled;

	document.addEventListener("fullscreenchange", checkFullscreen);
	document.addEventListener("mozfullscreenchange", checkFullscreen); // Firefox < 64
	document.addEventListener("webkitfullscreenchange", checkFullscreen); // Safari

	function checkFullscreen(): void {
		fullscreen.value = window.matchMedia("(display-mode: fullscreen)").matches ||
			Boolean(document.fullscreenElement) ||
			Boolean(document.mozFullScreenElement) ||
			Boolean(document.webkitCurrentFullScreenElement);
	}

	function toggleFullscreen(): void {
		if(fullscreen.value) {
			const doc = document;
			(doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen).apply(doc);
		} else {
			const el = document.documentElement;
			(el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen).apply(el);
		}
	}

</script>
