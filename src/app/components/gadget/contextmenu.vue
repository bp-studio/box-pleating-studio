<template>
	<div class="dropdown-menu" @touchstartout="hide" @mousedownout="hide" @touchend="hide" @mouseup="hide">
		<slot></slot>
	</div>
</template>

<script lang="ts">
	import { Vue, Component, Prop } from 'vue-property-decorator';
	import Popper from 'popper.js';
	import $ from 'jquery/index';

	@Component
	export default class ContextMenu extends Vue {

		private shown: boolean = false;

		public show(e: MouseEvent) {
			new Popper(
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
					},
					clientHeight: 0,
					clientWidth: 0,
				} as Popper.ReferenceObject,
				this.$el,
				{
					placement: "bottom-start"
				}
			);
			$(this.$el).addClass('show');
			this.shown = true;
		}

		private hide() {
			if(this.shown) {
				// 這邊必須設置一個延遲，否則觸控模式中會不能按
				setTimeout(() => $(this.$el).removeClass('show'), 10);
				this.shown = false;
			}
		}
	}
</script>
