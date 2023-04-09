/* eslint-disable new-cap */

import type PayPal from "@paypal/paypal-js";
import type { Ref } from "vue";

interface Store {
	amount: Ref<number | undefined>;
	extra: Ref<number>;
	processing: Ref<boolean>;
	name: Ref<string | undefined>;
	step: Ref<number>;
}

function onApprove(details: PayPal.OrderResponseBody, store: Store): void {
	if(gtag) {
		gtag("event", "purchase", {
			"transaction_id": details.id,
			"affiliation": "PayPal",
			"value": store.amount.value,
			"currency": "USD",
			"shipping": store.extra.value,
			"items": [
				{
					"id": "default",
					"name": "Supporting Box Pleating Studio",
					"category": "Donation",
					"quantity": 1,
					"price": store.amount.value,
				},
			],
		});
	}
	store.name.value = details.payer.name?.given_name;
	store.step.value = 2;
}

export function initPayPalButton(init: (action: PayPal.OnInitActions) => void, store: Store): void {
	if(typeof paypal === "undefined") {
		setTimeout(() => initPayPalButton(init, store), 0);
		return;
	}

	const purchase_units: PayPal.PurchaseUnit[] = [];
	purchase_units[0] = { amount: { value: "" } };

	if(!paypal.Buttons) return; // type guard
	paypal.Buttons({
		style: {
			color: "gold",
			shape: "pill",
			label: "paypal",
			layout: "horizontal",
		},
		onInit(data: Record<string, unknown>, actions: PayPal.OnInitActions) {
			init(actions);
		},
		onClick() {
			if(!store.amount.value) return;
			purchase_units[0].description = "Supporting Box Pleating Studio";
			purchase_units[0].amount.value = (store.amount.value + store.extra.value).toFixed(2);
		},
		createOrder(data: Record<string, unknown>, actions: PayPal.CreateOrderActions) {
			store.processing.value = true;
			return actions.order.create({ purchase_units });
		},
		onApprove(data: Record<string, unknown>, actions: PayPal.OnApproveActions): Promise<void> {
			if(!actions.order) return Promise.resolve();
			return actions.order!.capture().then((details: PayPal.OrderResponseBody) => onApprove(details, store));
		},
		onCancel(data: Record<string, unknown>, actions: PayPal.OnCancelledActions) {
			store.processing.value = false;
		},
	}).render("#paypal-button-container");
}
