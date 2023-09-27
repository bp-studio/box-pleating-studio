<template>
	<div class="modal fade" ref="el">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content mx-4">
				<div class="modal-header">
					<div class="h4 modal-title" v-t="'about.title'"></div>
				</div>
				<div class="modal-body">
					<p>{{ copyright }}</p>
					<p v-t="'about.license'"></p>
					<i18n-t keypath="about.manual" tag="p" scope="global">
						<a target="_blank" rel="noopener" href="https://bp-studio.github.io" v-t="'keyword.homepage'"></a>
					</i18n-t>
					<i18n-t keypath="about.feedback" tag="p" scope="global">
						<a target="_blank" rel="noopener" href="https://github.com/bp-studio/box-pleating-studio"
						   v-t="'about.repo'"></a>
					</i18n-t>
					<i18n-t keypath="about.visitBlog" tag="p" scope="global">
						<a target="_blank" rel="noopener" href="https://origami.abstreamace.com/" v-t="'about.blog'"></a>
					</i18n-t>
					<i18n-t keypath="about.donation" tag="p" scope="global">
						<a target="_blank" href="donate.htm">PayPal</a>
					</i18n-t>

					<!--
						For now there isn't too many sponsors, so we put a fixed list here.
						Dynamic approach may be considered in the future if needed.
					-->
					<p>
						{{ $t('about.sponsor') }}
						<a target="_blank" rel="noopener" href="https://www.obb.design/">Boice Wong</a>,
						<a target="_blank" rel="noopener" href="https://cexplr.github.io/">Lucas Tay Kiat Loong</a>,
						<a target="_blank" rel="noopener" href="https://wg-origami.blogspot.com/">William Gozali</a>,
						<a target="_blank" rel="noopener" href="https://chrisconradart.com/">Christopher Conrad</a>,
						Daniele Fusco
					</p>
				</div>
				<div class="modal-footer">
					<div class="flex-grow-1"><span v-t="'keyword.version'" /> {{ version }}</div>
					<button type="button" class="btn btn-primary" data-bs-dismiss="modal" v-t="'keyword.ok'"></button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">

	import { computed } from "vue";

	import { copyright } from "app/misc/copyright";
	import useModal from "./modal";

	defineOptions({ name: "About" });

	const { el, show } = useModal("About");

	const version = computed(() => {
		const meta = document.querySelector("meta[name=version]") as HTMLMetaElement;
		return meta.content + " build " + app_config.app_version;
	});

	defineExpose({ show });

</script>
