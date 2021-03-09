<template>
	<div v-if="label" style="display:contents;">
		<div class="col-form-label">{{ label }}</div>
		<div>
			<slot></slot>
		</div>
	</div>
	<div v-else style="grid-column-end:span 2">
		<slot></slot>
	</div>
</template>

<script lang="ts">
	import { Vue, Component, Prop } from 'vue-property-decorator';

	@Component
	export default class Row extends Vue {
		@Prop(String) public label: string;
	}
</script>
