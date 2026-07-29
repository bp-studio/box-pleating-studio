<template>
	<div class="h5 panel-title">{{ $t("panel.repo.type") }}</div>
	<template v-if="stretch.repo">
		<div v-if="configCount(stretch.repo) == 1 && patternCount(stretch.repo) == 1" class="row">
			<label class="col-form-label col">{{ $t("panel.repo.onlyOne") }}</label>
		</div>
		<div v-else class="panel-grid">
			<Store
				:size="configCount(stretch.repo)"
				:index="stretch.configIndex"
				:label="$t('panel.repo.config')"
				@move="stretch.switchConfig($event)"
			/>
			<Store
				:size="patternCount(stretch.repo)"
				:index="stretch.patternIndex"
				:label="$t('panel.repo.pattern')"
				@move="stretch.switchPattern($event)"
			/>
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

</script>
