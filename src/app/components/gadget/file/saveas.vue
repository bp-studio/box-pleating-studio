<template>
	<a v-if="!disabled" class="dropdown-item" @click="execute()">
		<slot></slot>
	</a>
	<div v-else class="dropdown-item disabled" @click.stop>
		<slot></slot>
	</div>
</template>

<script lang="ts">
	import { Vue, Component, Prop } from 'vue-property-decorator';

	@Component
	export default class SaveAs extends Vue {

		@Prop(String) public type: string;
		@Prop(String) public desc: string;
		@Prop(String) public mime: string;
		@Prop(Boolean) public disabled: boolean;

		public async execute() {
			try {
				let handle = await showSaveFilePicker({
					suggestedName: core.getFilename(this.type),
					types: [{
						description: this.desc,
						accept: {
							[this.mime]: ['.' + this.type],
						},
					}]
				} as SaveFilePickerOptions);
				let writable = await handle.createWritable();
				let blob = await core.getBlob(this.type);
				await writable.write(blob);
				await writable.close();
				this.$emit('save', handle);

			} catch(e) {
				// 使用者取消的話會跑到這邊來
				return;
			}
		}
	}
</script>
