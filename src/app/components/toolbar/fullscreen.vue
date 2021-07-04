<template>
	<div class="browser-only" v-show="fullscreenEnabled">
		<div class="dropdown-item" @click="toggleFullscreen">
			<i class="fas fa-expand"></i>
			{{fullscreen?$t('toolbar.setting.fullscreenExit'):$t('toolbar.setting.fullscreen')}}
		</div>
		<divider></divider>
	</div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator';

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

	@Component
	export default class Fullscreen extends Vue {
		private fullscreen = false;
		private fullscreenEnabled = document.fullscreenEnabled ||
			document.mozFullscreenEnabled || document.webkitFullscreenEnabled;

		created(): void {
			document.addEventListener('fullscreenchange', () => this.checkFullscreen());
			document.addEventListener('mozfullscreenchange', () => this.checkFullscreen()); // Firefox < 64
			document.addEventListener('webkitfullscreenchange', () => this.checkFullscreen()); // Safari
		}

		private checkFullscreen(): void {
			this.fullscreen = window.matchMedia('(display-mode: fullscreen)').matches ||
				Boolean(document.fullscreenElement) ||
				Boolean(document.mozFullScreenElement) ||
				Boolean(document.webkitCurrentFullScreenElement);
		}

		public toggleFullscreen(): void {
			if(this.fullscreen) {
				let doc = document;
				(doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen)
					.apply(doc);
			} else {
				let el = document.documentElement;
				(el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen)
					.apply(el);
			}
		}
	}
</script>
