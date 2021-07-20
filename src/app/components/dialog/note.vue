<template>
	<div>
		<button id="note" class="btn btn-light text-warning" v-on:click="show">
			<i class="fas fa-exclamation-triangle h1"></i>
		</button>
		<div class="modal fade" ref="mdl">
			<div class="modal-dialog modal-dialog-centered">
				<div class="modal-content">
					<div class="modal-body" v-t="'message.patternNotFound'"></div>
					<div class="modal-footer">
						<button type="button" class="btn btn-primary" data-bs-dismiss="modal" v-t="'keyword.ok'"></button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';
	import Modal from '../mixins/modal';


	@Component
	export default class Note extends Modal {
		protected getModelElement(): Element {
			return this.$refs.mdl as Element;
		}
		protected getScreenName(): string {
			return 'Note';
		}
	}
</script>
