<template>
	<row :label="label">
		<div class="input-group">
			<button class="btn btn-sm btn-primary" type="button" @click="data.move(-1)">
				<i class="fas fa-arrow-left"></i>
			</button>
			<input class="form-control text-center" readonly type="text" :value="(data.index+1)+' / '+data.size" />
			<button class="btn btn-sm btn-primary" type="button" @click="data.move(1)">
				<i class="fas fa-arrow-right"></i>
			</button>
		</div>
	</row>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator';

	@Component
	export default class Store extends Vue {
		@Prop(Object) public data: {
			move(step: number): void;
			readonly index: number;
			readonly size: number;
		};
		@Prop(String) public label: string;
	}
</script>
