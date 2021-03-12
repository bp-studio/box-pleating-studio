<template>
	<dropdown icon="bp-question-circle" :title="$t('toolbar.help.title')" :notify="notify||core.updated">
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
		<div class="dropdown-item" @click="update" v-if="core.updated">
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
	import { core } from '../core.vue';

	import BaseComponent from '../mixins/baseComponent';

	declare const logs: number[];

	@Component
	export default class HelpMenu extends BaseComponent {

		private notify: boolean;

		mounted() {
			let v = parseInt(localStorage.getItem("last_log") || "0");
			this.notify = v < logs[logs.length - 1];
		}

		protected async update() {
			if(await core.confirm(this.$t("message.updateReady"))) location.reload();
		}

		protected async checkUpdate() {
			let reg = await navigator.serviceWorker.ready;
			let cb = () => this.update();
			reg.addEventListener("updatefound", cb, { once: true });
			await reg.update();
			if(!reg.installing && !reg.waiting) {
				reg.removeEventListener("updatefound", cb);
				await core.alert(this.$t("message.latest"));
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
