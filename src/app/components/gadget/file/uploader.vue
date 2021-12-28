<template>
	<div>
		<input type="file" :id="id" :accept="type" :multiple="multiple" class="d-none" @change="$emit('upload', $event)" />
		<label class="dropdown-item m-0" :for="id" ref="lbl">
			<slot></slot>
		</label>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator';

	@Component
	export default class Uploader extends Vue implements Executor {

		protected id: string = "file" + this._uid;

		@Prop(String) public accept: string;
		@Prop(Boolean) public multiple: boolean;

		protected get type(): string {
			// 已知 Safari 對於 accept 屬性的支援有問題
			return navigator.vendor && navigator.vendor.startsWith("Apple") ? "" : this.accept;
		}

		public execute(): void {
			(this.$refs.lbl as HTMLLabelElement).click();
		}
	}
</script>
