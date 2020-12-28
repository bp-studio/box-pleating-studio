<template>
	<div>
		<input type="file" :id="id" :accept="accept" :multiple="multiple" class="d-none" @change="$emit('upload', $event)" />
		<label class="dropdown-item m-0" :for="id">
			<slot></slot>
		</label>
	</div>
</template>

<script lang="ts">
	import { Vue, Component, Prop } from 'vue-property-decorator';
	import { Shrewd } from '../import/BPStudio';
	import InputMixin from '../mixins/inputMixin';

	@Component
	export default class Uploader extends Vue {

		private id: string = "file" + this._uid;

		@Prop(String) public accept: string;
		@Prop(Boolean) public multiple: boolean;
	}
</script>
