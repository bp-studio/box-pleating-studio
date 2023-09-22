<template>
	<Spinner ref="spinner" />
	<template v-if="initialized">
		<Alert ref="alert" />
		<Confirm ref="confirm" />
		<Error ref="error" />
	</template>
</template>

<script setup lang="ts">

	import { onMounted, shallowRef } from "vue";

	import { compRef } from "app/utils/compRef";
	import { setup } from "app/services/dialogService";
	import Lib from "app/services/libService";
	import Spinner from "./spinner.vue";
	import Alert from "./alert.vue";
	import Confirm from "./confirm.vue";
	import Error from "./error.vue";

	/**
	 * This component is responsible for registering various mandatory dialogs on the dialogService.
	 */
	defineOptions({ name: "DialogFragment" });

	const spinner = compRef(Spinner);
	const confirm = compRef(Confirm);
	const alert = compRef(Alert);
	const error = compRef(Error);

	const initialized = shallowRef(false);
	Lib.ready.then(() => initialized.value = true);

	onMounted(() => {
		setup({
			alert: msg => alert.value!.show(msg),
			error: (msg, backup) => error.value!.show(msg, backup),
			confirm: msg => confirm.value!.show(msg),
			loader: spinner.value!,
		});
	});

</script>
