<template>
	<div class="modal fade" ref="el">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4">
				<div class="modal-body scroll-shadow" style="max-height: 70vh; border-radius: 0.3rem;">
					<div v-if="record[index]" v-html="record[index]"></div>
					<div v-else class="m-5 display-2 text-muted text-center">
						<i class="bp-spinner fa-spin" />
					</div>
				</div>
				<div class="modal-footer">
					<div class="flex-grow-1">
						<button class="btn btn-primary me-2" style="width: 2.5rem;" :disabled="index == 0" @click="index--">
							<i class="fas fa-caret-left" />
						</button>
						<button class="btn btn-primary" style="width: 2.5rem;" :disabled="index == max" @click="index++">
							<i class="fas fa-caret-right" />
						</button>
					</div>
					<button type="button" class="btn btn-primary" data-bs-dismiss="modal" v-t="'keyword.ok'"></button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	export default { name: "Version" };
</script>

<script setup lang="ts">

	import { reactive, shallowRef, watch } from "vue";

	import Dialogs from "app/services/dialogService";
	import useModal from "./modal";

	const max = logs.length - 1;
	const index = shallowRef<number>(max);
	const record = reactive<Record<number, string>>({});

	const { el, show, hide, on } = useModal("News", () => load(index.value));

	watch(index, id => load(id));

	async function load(id: number): Promise<boolean> {
		if(!record[id]) {
			try {
				const response = await fetch(`log/${logs[id]}.md`);
				let html = await response.text();
				html = html.replace(/<a href="http/g, "<a target=\"_target\" rel=\"noopener\" href=\"http");
				if(!record[id]) record[id] = html;
			} catch(e) {
				if(on.value) {
					hide();
					Dialogs.alert(i18n.t("message.connFail"));
				}
				return false;
			}
		}
		return true;
	}

	defineExpose({ show });

</script>
