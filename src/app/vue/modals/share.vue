<template>
	<div class="modal fade" ref="el">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4">
				<div class="modal-header">
					<div class="h4 modal-title">{{ $t("share.title") }}</div>
				</div>
				<div class="modal-body p-5 text-center" v-if="sending">
					<i class="bp-spinner fa-spin display-4" />
				</div>
				<template v-else>
					<div class="modal-body p-3 text-center" v-if="error">{{ error }}</div>
					<div class="modal-body" v-else>
						<div class="mb-2">
							<div class="input-group">
								<input class="form-control" :value="url" ref="input" />
							</div>
						</div>
						<div class="d-flex">
							<div>
								<button v-if="canShare" class="btn btn-primary me-2" @click="share">
									<i class="fas fa-share" />
									{{ $t('share.share') }}
								</button>
								<CheckButton class="btn btn-primary" @click="copy" ref="bt">
									<i class="fas fa-copy" />
									{{ $t('share.copy') }}
								</CheckButton>
							</div>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-primary" data-bs-dismiss="modal">{{ $t("keyword.ok") }}</button>
					</div>
				</template>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">

	import { shallowRef } from "vue";

	import Studio from "app/services/studioService";
	import LZ from "app/utils/lz";
	import { copyEnabled } from "app/shared/constants";
	import useModal from "./modal";
	import { compRef } from "app/utils/compRef";
	import CheckButton from "@/gadgets/form/checkButton.vue";

	defineOptions({ name: "Share" });

	const url = shallowRef("");
	const canShare = Boolean(navigator.share);
	const sending = shallowRef(false);
	const error = shallowRef<string | null>(null);

	const bt = compRef(CheckButton);
	const input = shallowRef<HTMLInputElement>();

	const { el, show } = useModal("Share", {
		onBeforeShow: async () => {
			if(!Studio.project) return false;
			const data = await LZ.compress(JSON.stringify(Studio.project));
			const host = location.host.includes("qa") ? location.host : "bpstudio.abstreamace.com";
			shorten(`https://${host}/?project=${data}`);
			return true;
		},
	});

	async function copy(): Promise<void> {
		let apiCopied = false;
		try {
			if(copyEnabled) {
				await navigator.clipboard.writeText(url.value);
				apiCopied = true;
			}
		} catch(e) {
			// Error might happen in in-app browsers.
			// In that case we fallback to polyfill.
		}
		if(!apiCopied) {
			// polyfill
			const ipt = input.value!;
			ipt.select();
			document.execCommand("copy");
		}
		bt.value!.check();
		gtag("event", "share", { method: "copy", content_type: "link" });
	}

	function share(): void {
		navigator.share({
			title: "Box Pleating Studio",
			text: i18n.t("share.message", [Studio.project!.design.title]).toString(),
			url: url.value,
		}).catch(() => {
			// No need to handle cancelling
		});
		gtag("event", "share", { method: "app", content_type: "link" });
	}

	async function shorten(rawUrl: string): Promise<void> {
		sending.value = true;
		try {
			const api = "https://tinyurl.com/api-create.php?url=" + encodeURIComponent(rawUrl);
			// For unknown reason, using `{ cache: "reload" }`
			// option here will lead to no-response error in Safari.
			const response = await fetch(api);
			url.value = await response.text();
			sending.value = false;
			await waitButton();
			bt.value!.focus();
		} catch {
			sending.value = false;
			url.value = rawUrl;
			error.value = i18n.t("message.connFail").toString();
		}
	}

	function waitButton(): Promise<void> {
		const SHORT_INTERVAL = 10;
		return new Promise<void>(resolve => {
			if(bt.value) {
				resolve();
			} else {
				const int = setInterval(() => {
					if(bt.value) {
						clearInterval(int);
						resolve();
					}
				}, SHORT_INTERVAL);
			}
		});
	}

	defineExpose({ show });

</script>
