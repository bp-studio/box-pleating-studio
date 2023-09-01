<template>
	<div v-t="'panel.repo.type'" class="h5 panel-title"></div>
	<template v-if="stretch.repo">
		<div class="row" v-if="configCount(stretch.repo) == 1 && patternCount(stretch.repo) == 1">
			<label class="col-form-label col" v-t="'panel.repo.onlyOne'"></label>
		</div>
		<div class="panel-grid" v-else>
			<Store :size="configCount(stretch.repo)" :index="stretch.repo.index" @move="stretch.switchConfig($event)"
				   :label="$t('panel.repo.config')"></store>
			<Store :size="patternCount(stretch.repo)" :index="patternIndex(stretch.repo)" @move="stretch.switchPattern($event)"
				   :label="$t('panel.repo.pattern')"></Store>
		</div>
	</template>
</template>

<script setup lang="ts">

	import Store from "@/gadgets/form/store.vue";

	import type { JRepository } from "shared/json/pattern";
	import type { Stretch } from "client/project/components/layout/stretch";

	defineOptions({ name: "Stretch" });

	defineProps<{ stretch: Stretch }>();

	function configCount(repo: JRepository): number {
		return repo.configurations.length;
	}

	function patternCount(repo: JRepository): number {
		return repo.configurations[repo.index].patterns.length;
	}

	function patternIndex(repo: JRepository): number {
		return repo.configurations[repo.index].index;
	}

</script>
