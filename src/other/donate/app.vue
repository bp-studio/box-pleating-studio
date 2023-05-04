<template>
	<div class="container h-100">
		<div class="h-100 d-flex flex-column">
			<div class="flex-grow-1" v-if="step == 1">
				<div class="h4" v-t="'donate.title'"></div>
				<div v-t="'donate.intro'"></div>
				<div class="form-row mt-3">
					<div class="input-group">
						<div class="input-group-text">$</div>
						<input class="form-control" type="number" v-model.number="amount" @input="amountChange" />
						<div class="input-group-text">USD{{ handling }}</div>
					</div>
					<div class="text-danger" v-show="error" v-t="'donate.error'"></div>
				</div>
				<div class="mt-3" v-t="'donate.then'"></div>
				<div class="text-center mt-3" id="paypal-button-container"></div>
				<div v-if="processing" v-t="'donate.wait'"></div>
			</div>
			<div class="flex-grow-1" v-if="step == 2">
				<div class="h4" v-t="'donate.title'"></div>
				<div>{{ $t('donate.thank', [name]) }}</div>
			</div>
			<div class="wait flex-grow-0">
				<button class="btn btn-primary w-100" onclick="window.close()">{{ step == 1 ? $t('donate.nextTime') :
					$t('keyword.close')
				}}</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, onMounted, shallowRef } from "vue";

	import { initPayPalButton } from "./paypal";

	import type PayPal from "@paypal/paypal-js";

	const step = shallowRef(1);
	const name = shallowRef<string>();
	const error = shallowRef(false);
	const amount = shallowRef<number>();
	const processing = shallowRef(false);

	let actions: PayPal.OnInitActions | null = null;

	onMounted(() => initPayPalButton((action: PayPal.OnInitActions): void => {
		action.disable();
		actions = action;
	}, { step, name, amount, extra, processing }));

	const extra = computed(() =>
		// This formula computes Paypal fee
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		amount.value ? amount.value * 0.046025 + 0.3138 : 0
	);
	const handling = computed(() => amount.value ? " + $" + extra.value.toFixed(2) : "");

	function amountChange(): void {
		if(!actions) return;
		if(error.value = Boolean(amount.value)) actions.disable();
		else actions.enable();
	}

</script>
