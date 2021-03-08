<template>
	<div class="panel-row">
		<div class="col-form-label">{{ label }}</div>
		<div>
			<slot></slot>
		</div>
	</div>
</template>

<script lang="ts">
	import { Vue, Component, Prop } from 'vue-property-decorator';

	@Component
	export default class Row extends Vue {
		@Prop(String) public label: string;
	}
</script>
