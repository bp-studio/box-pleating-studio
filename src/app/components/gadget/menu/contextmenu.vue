<template>
	<div class="dropdown-menu" @touchend="hide" @mouseup="hide">
		<slot></slot>
	</div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator';
	import Popper from '@popperjs/core';

	@Component
	export default class ContextMenu extends Vue {

		private shown: boolean = false;

		mounted(): void {
			let handle = (event: Event): void => {
				if(this.shown && !this.$el.contains(event.target as Element)) this.hide();
			};
			document.addEventListener('touchstart', handle, { capture: true, passive: true });
			document.addEventListener('mousedown', handle, { capture: true, passive: true });
		}

		public show(e: MouseEvent): void {
			Popper.createPopper(
				{
					getBoundingClientRect() {
						return {
							top: e.pageY,
							bottom: e.pageY,
							left: e.pageX,
							right: e.pageX,
							width: 0,
							height: 0,
						};
					},
				} as Popper.VirtualElement,
				this.$el as HTMLElement,
				{
					placement: "bottom-start",
				}
			);
			this.$el.classList.add('show');
			this.shown = true;
		}

		private hide(): void {
			// 已知設定延遲為 10 在某些版本的 Safari 上面是不夠的，所以安全起見設成 50
			const HIDDEN_DELAY = 50;
			if(this.shown) {
				// 這邊必須設置一個延遲，否則觸控模式中會不能按
				setTimeout(() => this.$el.classList.remove('show'), HIDDEN_DELAY);
				this.shown = false;
			}
		}
	}
</script>
