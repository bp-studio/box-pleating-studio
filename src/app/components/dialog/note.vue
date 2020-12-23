<template>
	<div>
		<button id="note" class="btn btn-light text-warning" v-on:click="note">
			<i class="fas fa-exclamation-triangle h1"></i>
		</button>
		<div id="mdlNote" class="modal fade">
			<div class="modal-dialog modal-dialog-centered">
				<div class="modal-content">
					<div class="modal-body" v-t="'message.patternNotFound'"></div>
					<div class="modal-footer">
						<button type="button" class="btn btn-primary" data-dismiss="modal" v-t="'keyword.ok'"></button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Vue, Component } from 'vue-property-decorator';
	import $ from 'jquery/index';

	declare const gtag: any;

	@Component
	export default class Note extends Vue {
		private note() {
			$('#mdlNote').modal();
			gtag('event', 'screen_view', { screen_name: 'Note' });
		}
	}
</script>
