<template>
	<div class="d-flex">
		<div class="flex-grow-1">
			<i :class="icon"></i>
			<slot></slot>
		</div>
		<div class="ms-3 text-end desktop-only">
			<template v-if="ctrl">
				<i v-if="isMac" class="bp-command"></i>
				<span v-else>Ctrl+</span>
			</template>
			<template v-if="shift">
				<i v-if="isMac" class="bp-shift"></i>
				<span v-else>Shift+</span>
			</template>
			{{hk}}
		</div>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator';

	@Component
	export default class HotKey extends Vue {
		@Prop(String) public icon: string;
		@Prop(String) public hk: string;
		@Prop(Boolean) public ctrl: boolean;
		@Prop(Boolean) public shift: boolean;

		protected get isMac(): boolean { return isMac; }
	}
</script>
