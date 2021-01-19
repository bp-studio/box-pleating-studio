<template>
	<div class="d-flex">
		<div class="flex-grow-1">
			<i :class="icon"></i>
			<slot></slot>
		</div>
		<div class="ms-3 text-end desktop-only">{{hk}}</div>
	</div>
</template>

<script lang="ts">
	import { Vue, Component, Prop } from 'vue-property-decorator';

	@Component
	export default class HotKey extends Vue {
		@Prop(String) public icon: string;
		@Prop(String) public hk: string;
	}
</script>
