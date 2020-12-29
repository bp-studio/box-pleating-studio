<template>
	<div class="btn-group">
		<button
			type="button"
			@mouseenter="mouseenter"
			:title="title"
			class="btn btn-primary dropdown-toggle"
			data-toggle="dropdown"
		>
			<i :class="icon"></i>
			<div class="notify" v-if="notify"></div>
		</button>
		<div class="dropdown-menu" @touchstartout="hide" @mousedownout="hide">
			<slot></slot>
		</div>
	</div>
</template>

<script lang="ts">
	import { Vue, Component, Prop } from 'vue-property-decorator';
	import { core } from '../core.vue';
	import $ from 'jquery/index';

	@Component
	export default class Dropdown extends Vue {
		@Prop(String) public icon: string;
		@Prop(String) public title: string;
		@Prop(Boolean) public notify: boolean;

		private bt: any;

		mounted() {
			let self = this;
			this.bt = $(this.$el).find('button');
			$(this.$el)
				.on('shown.bs.dropdown', function() { core.dropdown = self })
				.on('hide.bs.dropdown', function() { core.dropdown = null; })
				.on('hidden.bs.dropdown', () => this.$emit('hide'));
		}

		private hide() {
			this.bt.dropdown('hide');
		}

		private mouseenter() {
			if(core.dropdown && core.dropdown != this) this.bt.click();
		}
	}
</script>
