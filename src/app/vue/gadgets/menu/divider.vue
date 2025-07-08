<template>
	<div style="overflow: auto;" @click.stop @touchend.stop @mouseup.stop>
		<div class="dropdown-divider"/>
	</div>
</template>

<script setup lang="ts">
	defineOptions({ name: "Divider" });
</script>
