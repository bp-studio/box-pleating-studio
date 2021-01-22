<template>
	<div>
		<input type="file" :id="id" :accept="accept" :multiple="multiple" class="d-none" @change="$emit('upload', $event)" />
		<label class="dropdown-item m-0" :for="id" ref="lbl">
			<slot></slot>
		</label>
	</div>
</template>

<script lang="ts">
	import { Vue, Component, Prop } from 'vue-property-decorator';

	@Component
	export default class Uploader extends Vue {

		private id: string = "file" + this._uid;

		@Prop(String) public accept: string;
		@Prop(Boolean) public multiple: boolean;

		public click() {
			(this.$refs.lbl as HTMLLabelElement).click();
		}
	}
</script>
