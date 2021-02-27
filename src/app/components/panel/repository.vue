<template >
	<div>
		<h5 v-t="'panel.repo.type'" class="panel-title"></h5>
		<store v-if="repository.size>1" :data="repository" :label="$t('panel.repo.config')"></store>
		<store v-if="repository.entry.size>1" :data="repository.entry" :label="$t('panel.repo.pattern')"></store>
		<div class="row" v-else-if="repository.size==1">
			<label class="col-form-label col" v-t="'panel.repo.onlyOne'"></label>
		</div>
	</div>
</template>


<script lang="ts">
	import { Vue, Component, Prop } from 'vue-property-decorator';

	@Component
	export default class Repository extends Vue {
		@Prop(Object) public repository: any;
	}
</script>
