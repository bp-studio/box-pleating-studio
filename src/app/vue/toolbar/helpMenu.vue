<template>
	<Dropdown :icon="icon" :title="$t('toolbar.help.title')" :notify="notify || updateReady">
		<div class="dropdown-item" @click="show('about')">
			<i class="bp-info" />{{ $t('toolbar.help.about') }}
		</div>
		<div class="dropdown-item" @click="news">
			<i class="fas fa-newspaper" />{{ $t('toolbar.help.news') }}
			<div class="notify" v-if="notify"></div>
		</div>
		<a class="dropdown-item" href="https://bp-studio.github.io" target="_blank" rel="noopener">
			<i class="fas fa-globe" />{{ $t("toolbar.help.homepage") }}
		</a>
		<a class="dropdown-item" href="https://discord.gg/HkcdTDS4zZ" target="_blank" rel="noopener">
			<i class="fab fa-discord" />
			Discord
		</a>
		<a class="dropdown-item" href="https://github.com/MuTsunTsai/box-pleating-studio/discussions" target="_blank"
		   rel="noopener">
			<i class="far fa-comment-dots" />{{ $t("toolbar.help.discussions") }}
		</a>
		<a class="dropdown-item" href="https://github.com/MuTsunTsai/box-pleating-studio/issues/new/choose" target="_blank"
		   rel="noopener">
			<i class="fas fa-bug" />{{ $t("toolbar.help.issue") }}
		</a>
		<Divider />
		<template v-if="serviceWorkerEnabled">
			<DropdownItem disabled v-if="checking">
				<i class="bp-spinner fa-spin" />{{ $t('toolbar.help.checkUpdate') }}
			</DropdownItem>
			<div class="dropdown-item" @click="update" v-else-if="updateReady">
				<i class="far fa-arrow-alt-circle-up" />{{ $t('toolbar.help.update') }}
				<div class="notify"></div>
			</div>
			<div class="dropdown-item" @click="checkUpdate" v-else>
				<i class="far fa-arrow-alt-circle-up" />{{ $t('toolbar.help.checkUpdate') }}
			</div>
			<Divider />
		</template>
		<a class="dropdown-item" href="donate.htm" target="_blank" rel="noopener">
			<i class="fas fa-hand-holding-usd" />{{ $t('toolbar.help.donation') }}
		</a>
	</Dropdown>
</template>

<script lang="ts">
	export default { name: "HelpMenu" };
</script>

<script setup lang="ts">

	import { computed, onMounted, shallowRef } from "vue";

	import { Divider, Dropdown, DropdownItem } from "@/gadgets/menu";
	import Dialogs from "app/services/dialogService";
	import { updateReady } from "app/misc/updateReady";
	import { show } from "../modals/modalFragment.vue";

	const notify = shallowRef(false);
	const checking = shallowRef(false);

	const serviceWorkerEnabled = "serviceWorker" in navigator;

	onMounted(() => {
		const v = parseInt(localStorage.getItem("last_log") || "0");
		notify.value = v < logs[logs.length - 1];
	});

	const icon = computed(() => checking.value ? "bp-spinner fa-spin" : "bp-info");

	async function update(): Promise<void> {
		if(await Dialogs.confirm(i18n.t("message.updateReady"))) location.reload();
	}

	async function checkUpdate(): Promise<void> {
		checking.value = true;
		// eslint-disable-next-line compat/compat
		const reg = await navigator.serviceWorker.ready;
		await reg.update();
		const sw = reg.installing || reg.waiting;
		if(!sw) {
			checking.value = false;
			await Dialogs.alert(i18n.t("message.latest"));
		} else {
			sw.addEventListener("statechange", e => {
				if(sw!.state == "installed") {
					checking.value = false;
					update();
				}
			});
		}
	}

	function news(): void {
		if(notify.value) {
			localStorage.setItem("last_log", logs[logs.length - 1].toString());
			notify.value = false;
		}
		show("ver");
	}

</script>

<style lang="scss">
	.notify {
		display: inline-block;
		height: 0.25em;
		width: 0.25em;
		border-radius: 0.125em;
		background-color: red;

		.dropdown-item > & {
			position: relative;
			top: -0.5em;
		}

		button > & {
			position: absolute;
			top: 0.3rem;
			right: 0.3rem;
		}
	}
</style>
