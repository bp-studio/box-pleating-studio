<template>
	<h5 v-t="'panel.repo.type'" class="panel-title"></h5>
	<!-- <div class="row" v-if="repository.size==1&&entry.size==1">
		<label class="col-form-label col" v-t="'panel.repo.onlyOne'"></label>
	</div>
	<div class="panel-grid" v-else>
		<store v-if="repository.size>1" :data="repository" :label="$t('panel.repo.config')"></store>
		<store v-if="entry.size>1" :data="repository.entry" :label="$t('panel.repo.pattern')"></store>
	</div> -->
</template>

<script lang="ts">
	export default { name: "Repository" };
</script>

<script setup lang="ts">

</script>
