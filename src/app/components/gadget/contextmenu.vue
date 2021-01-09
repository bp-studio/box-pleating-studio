<template>
	<div class="dropdown-menu" @touchstartout="hide" @mousedownout="hide" @touchend="hide" @mouseup="hide">
		<slot></slot>
	</div>
</template>

<script lang="ts">
	import { Vue, Component, Prop } from 'vue-property-decorator';
	import Popper from '@popperjs/core';

	@Component
	export default class ContextMenu extends Vue {

		private shown: boolean = false;

		public show(e: MouseEvent) {
			Popper.createPopper(
				{
					getBoundingClientRect() {
						return {
							top: e.pageY,
							bottom: e.pageY,
							left: e.pageX,
							right: e.pageX,
							width: 0,
							height: 0
						}
					}
				} as Popper.VirtualElement,
				this.$el as HTMLElement,
				{
					placement: "bottom-start"
				}
			);
			this.$el.classList.add('show');
			this.shown = true;
		}

		private hide() {
			if(this.shown) {
				// 這邊必須設置一個延遲，否則觸控模式中會不能按
				setTimeout(() => this.$el.classList.remove('show'), 10);
				this.shown = false;
			}
		}
	}
</script>
