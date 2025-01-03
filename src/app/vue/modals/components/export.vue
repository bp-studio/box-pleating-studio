<template>
	<div class="modal fade" ref="el">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4">
				<div class="modal-header">
					<div class="h4 modal-title">{{ title }}</div>
				</div>
				<div class="modal-body">
					<slot></slot>
					<div class="row mb-2" v-if="!isFileApiEnabled">
						<div class="col col-form-label flex-grow-0">{{ $t("keyword.filename") }}</div>
						<div class="col flex-grow-1">
							<input type="text" class="form-control" v-model="extFilename" />
						</div>
					</div>
					<div v-if="isInApp">{{ $t("message.inApp") }}</div>
					<div class="p-2 text-center">
						<button disabled v-if="!url" type="button" class="btn btn-lg btn-success">
							<i class="bp-spinner fa-spin" />
						</button>
						<CheckButton v-else-if="isFileApiEnabled" ref="bt" type="button" class="btn btn-lg btn-success"
									 @click="save">
							{{ $t("keyword.export") }}
						</CheckButton>
						<a v-else :href="url" :download="extFilename" class="btn btn-lg btn-success" @click="$emit('save')">{{
							$t("keyword.download") }}</a>
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-primary" data-bs-dismiss="modal">{{ $t("keyword.ok") }}</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">

	import { shallowRef, useAttrs, watch } from "vue";

	import Studio from "app/services/studioService";
	import useModal from "../modal";
	import { isFileApiEnabled, isInApp } from "app/shared/constants";
	import FileUtility from "app/utils/fileUtility";
	import { compRef } from "app/utils/compRef";
	import CheckButton from "@/gadgets/form/checkButton.vue";

	defineOptions({ name: "Export" });

	const bt = compRef(CheckButton);
	const url = shallowRef<string | null>(null);
	const extFilename = shallowRef<string>("");
	let suggestedName: string;

	const props = defineProps<{
		title: string;
		mime: MIMEType;
		description: string;
		extension: string;
		observe?: Action<object>;
		blob: Action<Promise<Blob>>;
	}>();

	const attrs = useAttrs();
	const { el, show, on } = useModal(attrs.screen as string, {
		onBeforeShow: () => Boolean(Studio.project),
	});

	async function update(): Promise<void> {
		tryClearURL();
		url.value = URL.createObjectURL(await props.blob());
	}

	function tryClearURL(): void {
		if(url.value) {
			URL.revokeObjectURL(url.value);
			url.value = null;
		}
	}

	if(props.observe) {
		watch(
			props.observe,
			() => {
				if(!on || !Studio.project) return;
				update();
			},
			{ deep: true }
		);
	}

	async function save(): Promise<void> {
		const result = await FileUtility.saveAs(
			{
				suggestedName,
				types: [{
					description: props.description,
					accept: {
						[props.mime]: [props.extension],
					},
				} as FilePickerAcceptType],
			},
			() => props.blob()
		);
		if(result) {
			bt.value!.check();
			emit("save");
		}
	}

	function showWithFilename(filename: string): void {
		suggestedName = filename;
		extFilename.value = filename + props.extension;
		update();
		show();
	}

	const emit = defineEmits(["save"]);
	defineExpose({ show: showWithFilename });

</script>
