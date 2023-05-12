<template>
	<div class="modal fade modal-second" ref="el">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content">
				<div class="modal-body">
					<div class="row">
						<div v-for="l in Language.options" :key="l" class="col text-center">
							<button @click="setLocale(l)" class="w-100 btn btn-light" data-bs-dismiss="modal">
								<img :src="'assets/flags/' + $t('flag', l) + '.png'" :alt="$t('flag', l)" width="64"
									 height="64" />
								<br />
								{{ $t('name', l) }}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script  setup lang="ts">

	import { onMounted, shallowRef } from "vue";

	import Language from "app/services/languageService";

	defineOptions({ name: "Language" });

	const el = shallowRef<HTMLDivElement>();

	let modal: bootstrap.Modal;

	function setLocale(l: string): void {
		i18n.locale = l;
	}

	function show(): void {
		if(Language.options.length) modal.show();
	}

	onMounted(() => {
		modal = new Bootstrap.Modal(el.value!);
		Language.onReset = show;
		show();
	});

</script>
