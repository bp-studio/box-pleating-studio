<template>
	<dropdown :icon="icon" :title="$t('toolbar.help.title')" :notify="notify||core.updated">
		<div class="dropdown-item" @click="$emit('about')">
			<i class="bp-info"></i>
			{{$t('toolbar.help.about')}}
		</div>
		<div class="dropdown-item" @click="news">
			<i class="fas fa-newspaper"></i>
			{{$t('toolbar.help.news')}}
			<div class="notify" v-if="notify"></div>
		</div>
		<a
			class="dropdown-item"
			href="https://github.com/MuTsunTsai/box-pleating-studio/discussions"
			target="_blank"
			rel="noopener"
		>
			<i class="far fa-comment-dots"></i>
			{{$t("toolbar.help.discussions")}}
		</a>
		<a
			class="dropdown-item"
			href="https://github.com/MuTsunTsai/box-pleating-studio/issues"
			target="_blank"
			rel="noopener"
		>
			<i class="fas fa-bug"></i>
			{{$t("toolbar.help.issue")}}
		</a>
		<divider></divider>
		<dropdownitem disabled v-if="checking">
			<i class="bp-spinner fa-spin"></i>
			{{$t('toolbar.help.checkUpdate')}}
		</dropdownitem>
		<div class="dropdown-item" @click="update" v-else-if="core.updated">
			<i class="far fa-arrow-alt-circle-up"></i>
			{{$t('toolbar.help.update')}}
			<div class="notify"></div>
		</div>
		<div class="dropdown-item" @click="checkUpdate" v-else>
			<i class="far fa-arrow-alt-circle-up"></i>
			{{$t('toolbar.help.checkUpdate')}}
		</div>
		<divider></divider>
		<a class="dropdown-item" href="donate.htm" target="_blank" rel="noopener">
			<i class="fas fa-hand-holding-usd"></i>
			{{$t('toolbar.help.donation')}}
		</a>
	</dropdown>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';

	import BaseComponent from '../mixins/baseComponent';

	declare const logs: number[];

	@Component
	export default class HelpMenu extends BaseComponent {

		private notify: boolean;
		private checking: boolean = false;

		mounted() {
			let v = parseInt(localStorage.getItem("last_log") || "0");
			this.notify = v < logs[logs.length - 1];
		}

		protected get icon() {
			return this.checking ? "bp-spinner fa-spin" : "bp-question-circle";
		}

		protected async update() {
			if(await core.confirm(this.$t("message.updateReady"))) location.reload();
		}

		protected async checkUpdate() {
			this.checking = true;
			let reg = await navigator.serviceWorker.ready;
			await reg.update();
			let sw = reg.installing || reg.waiting;
			if(!sw) {
				this.checking = false;
				await core.alert(this.$t("message.latest"));
			} else {
				sw.addEventListener('statechange', e => {
					if(sw.state == "activated") {
						this.checking = false;
						this.update();
					}
				});
			}
		}

		protected news() {
			if(this.notify) {
				localStorage.setItem("last_log", logs[logs.length - 1].toString());
				this.notify = false;
			}
			this.$emit('news');
		}

		protected get core() { return core; }
	}
</script>

<style>
	.notify {
		display: inline-block;
		height: 0.25em;
		width: 0.25em;
		border-radius: 0.125em;
		background-color: red;
	}

	.dropdown-item > .notify {
		position: relative;
		top: -0.5em;
	}

	button > .notify {
		position: absolute;
		top: 0.3rem;
		right: 0.3rem;
	}
</style>
