<template>
	<div style="overflow:auto;" @click.stop @touchend.stop @mouseup.stop>
		<div class="dropdown-divider"></div>
	</div>
</template>

<script lang="ts">
	import { Component, Vue } from 'vue-property-decorator';

	@Component
	export default class Divider extends Vue { }
</script>
