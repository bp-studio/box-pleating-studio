<template>
	<a v-if="!disabled" class="dropdown-item" @click="execute()">
		<slot></slot>
	</a>
	<div v-else class="dropdown-item disabled" @click.stop>
		<slot></slot>
	</div>
</template>

<script lang="ts">
	import { Component, Prop, Vue } from 'vue-property-decorator';

	import { Design } from "../../import/BPStudio";

	@Component
	export default class SaveAs extends Vue implements Executor {

		@Prop(String) public type: string;
		@Prop(String) public desc: string;
		@Prop(String) public mime: string;
		@Prop(Boolean) public disabled: boolean;

		public async execute(design?: Design, callback?: (handle: FileSystemFileHandle) => void): Promise<boolean> {
			try {
				let handle = await showSaveFilePicker({
					suggestedName: core.getFilename(this.type, design),
					types: [{
						description: this.desc,
						accept: {
							[this.mime]: ['.' + this.type],
						},
					}],
				} as SaveFilePickerOptions);
				let writable = await handle.createWritable();
				let blob = await core.getBlob(this.type, design);
				await writable.write(blob);
				await writable.close();
				if(callback) callback(handle);
				else this.$emit('save', handle);
				return true;
			} catch(e) {
				// 使用者取消的話會跑到這邊來
				return false;
			}
		}
	}
</script>
