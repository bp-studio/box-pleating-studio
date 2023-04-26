<template>
	<div v-t="'panel.repo.type'" class="h5 panel-title"></div>
	<template v-if="stretch.repo">
		<div class="row" v-if="stretch.repo.configCount == 1 && stretch.repo.patternCount == 1">
			<label class="col-form-label col" v-t="'panel.repo.onlyOne'"></label>
		</div>
		<div class="panel-grid" v-else>
			<Store :size="stretch.repo.configCount" :index="stretch.repo.configIndex" @move="stretch.switchConfig($event)"
				   :label="$t('panel.repo.config')"></store>
			<Store :size="stretch.repo.patternCount" :index="stretch.repo.patternIndex" @move="stretch.switchPattern($event)"
				   :label="$t('panel.repo.pattern')"></Store>
		</div>
	</template>
</template>

<script lang="ts">
	export default { name: "Stretch" };
</script>

<script setup lang="ts">
	import Store from "@/gadgets/form/store.vue";

	import type { Stretch } from "client/project/components/layout/stretch";

	defineProps<{ stretch: Stretch }>();
</script>
