<template>
	<template v-if="initialized">
		<Alert ref="alert" />
		<Confirm ref="confirm" />
		<Error ref="error" />
	</template>
</template>

<script setup lang="ts">

	import { onMounted, shallowRef, useTemplateRef } from "vue";

	import { setup } from "app/services/dialogService";
	import Alert from "./alert.vue";
	import Confirm from "./confirm.vue";
	import Error from "./error.vue";

	/**
	 * This component is responsible for registering various mandatory dialogs on the dialogService.
	 */
	defineOptions({ name: "DialogFragment" });

	const confirm = useTemplateRef("confirm");
	const alert = useTemplateRef("alert");
	const error = useTemplateRef("error");

	const initialized = shallowRef(false);
	import("bootstrap/js/dist/modal").then(() => initialized.value = true);

	onMounted(() => {
		setup({
			alert: msg => alert.value!.show(msg),
			error: log => error.value!.show(log),
			confirm: msg => confirm.value!.show(msg),
		});
	});

</script>
