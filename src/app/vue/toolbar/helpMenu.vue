<template>
	<Dropdown label="Help" :icon="icon" :title="$t('toolbar.help.title')" :notify="notify || updateReady">
		<div class="dropdown-item" @click="show('about')">
			<i class="bp-info text-info darken" />{{ $t('toolbar.help.about') }}
		</div>
		<div class="dropdown-item" @click="news">
			<i class="fas fa-newspaper" />{{ $t('toolbar.help.news') }}
			<div class="notify" v-if="notify"></div>
		</div>
		<a class="dropdown-item" href="https://bp-studio.github.io" target="_blank" rel="noopener">
			<i class="fas fa-globe" />{{ $t("toolbar.help.homepage") }}
		</a>
		<a class="dropdown-item" href="https://discord.gg/HkcdTDS4zZ" target="_blank" rel="noopener">
			<!-- Use official color -->
			<i class="fab fa-discord" style="color: #5865F2;" />Discord
		</a>
		<a class="dropdown-item" href="https://github.com/MuTsunTsai/box-pleating-studio/discussions" target="_blank" rel="noopener">
			<i class="far fa-comment-dots" />{{ $t("toolbar.help.discussions") }}
		</a>
		<a class="dropdown-item" href="https://github.com/MuTsunTsai/box-pleating-studio/issues/new/choose" target="_blank"
		   rel="noopener">
			<i class="fas fa-bug" />{{ $t("toolbar.help.issue") }}
		</a>
		<Divider />
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
		<a class="dropdown-item" href="donate.htm" target="_blank" rel="noopener">
			<i class="fas fa-hand-holding-usd text-warning darken" />{{ $t('toolbar.help.donation') }}
		</a>
	</Dropdown>
</template>

<script setup lang="ts">

	import { computed, onMounted, shallowRef } from "vue";

	import { Divider, Dropdown, DropdownItem } from "@/gadgets/menu";
	import Dialogs from "app/services/dialogService";
	import { updateReady } from "app/misc/updateReady";
	import { show } from "../modals/modalFragment.vue";

	defineOptions({ name: "HelpMenu" });

	const notify = shallowRef(false);
	const checking = shallowRef(false);

	// eslint-disable-next-line compat/compat
	const serviceWorker = navigator.serviceWorker;

	onMounted(() => {
		const v = parseInt(localStorage.getItem("last_log") || "0");
		notify.value = v < logs[logs.length - 1];
	});

	const icon = computed(() => checking.value ? "bp-spinner fa-spin" : "bp-question-circle");

	async function update(): Promise<void> {
		if(!await Dialogs.confirm(i18n.t("message.updateReady"))) return;

		// Make sure that we close the old service worker before continue.
		const registration = await serviceWorker.ready;
		if(await registration.unregister()) location.reload();
		else Dialogs.alert(i18n.t("message.restartFail"));
	}

	async function checkUpdate(): Promise<void> {
		checking.value = true;
		const reg = await serviceWorker.ready;
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

		width: 0.25em;
		height: 0.25em;

		background-color: red;
		border-radius: 0.125em;

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
