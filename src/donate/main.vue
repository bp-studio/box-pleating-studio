<template>
	<div class="container h-100">
		<div class="h-100 d-flex flex-column">
			<div class="flex-grow-1" v-if="step==1">
				<h4 v-t="'donate.title'"></h4>
				<div v-t="'donate.intro'"></div>
				<div class="form-row mt-3">
					<div class="input-group">
						<div class="input-group-prepend">
							<div class="input-group-text">$</div>
						</div>
						<input class="form-control" type="number" v-model.number="amount" @input="amountChange" />
						<div class="input-group-append">
							<div class="input-group-text">USD{{handling}}</div>
						</div>
					</div>
					<div class="text-danger" v-show="error" v-t="'donate.error'"></div>
				</div>
				<div class="mt-3" v-t="'donate.then'"></div>
				<div class="text-center mt-3" id="paypal-button-container"></div>
				<div v-if="processing" v-t="'donate.wait'"></div>
			</div>
			<div class="flex-grow-1" v-if="step==2">
				<h4 v-t="'donate.title'"></h4>
				<div>{{$t('donate.thank', [name])}}</div>
			</div>
			<div class="wait flex-grow-0">
				<button class="btn btn-primary w-100" onclick="window.close()" v-t="step==1?'donate.nextTime':'keyword.close'"></button>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { Vue, Component } from 'vue-property-decorator';

	declare const initPayPalButton: () => void;

	@Component
	export default class App extends Vue {
		private step = 1;
		private name: string;
		private error: boolean = false;
		private actions: any = null;
		private amount?: number;
		private processing: boolean = false;

		mounted() {
			initPayPalButton();
		}

		public init(actions: any) {
			actions.disable();
			this.actions = actions;
		}

		private get extra(): number {
			return this.amount * 0.046025 + 0.3138;
		}

		private get handling() {
			return this.amount > 0 ? ' + $' + this.extra.toFixed(2) : "";
		}

		private amountChange() {
			if(this.error = !(this.amount > 0)) this.actions.disable();
			else this.actions.enable();
		}
	}
</script>
