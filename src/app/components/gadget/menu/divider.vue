<template>
	<div style="overflow:auto;" @click.stop>
		<div class="dropdown-divider"></div>
	</div>
</template>

<script lang="ts">
	import { Vue, Component } from 'vue-property-decorator';

	@Component
	export default class Divider extends Vue { }
</script>