<template>
	<div class="row mb-1">
		<label class="col-form-label col-5">{{label}}</label>
		<div class="col-7">
			<div class="input-group">
				<button class="btn btn-sm btn-primary" type="button" @click="data.move(-1)">
					<i class="fas fa-arrow-left"></i>
				</button>
				<input class="form-control text-center" readonly type="text" :value="(data.index+1)+' / '+data.size" />
				<button class="btn btn-sm btn-primary" type="button" @click="data.move(1)">
					<i class="fas fa-arrow-right"></i>
				</button>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Vue, Component, Prop } from 'vue-property-decorator';

	@Component
	export default class Store extends Vue {
		@Prop(Object) public data: any;
		@Prop(String) public label: string;
	}
</script>
