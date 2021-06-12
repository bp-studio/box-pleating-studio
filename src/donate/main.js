/* eslint-disable no-undef */
/* eslint-disable new-cap */
/* eslint-disable max-lines-per-function */

function initPayPalButton() {
	let purchase_units = [];
	purchase_units[0] = {};
	purchase_units[0].amount = {};

	paypal.Buttons({
		style: {
			color: 'gold',
			shape: 'pill',
			label: 'paypal',
			layout: 'horizontal',
		},

		onInit(data, actions) {
			app.init(actions);
		},

		onClick() {
			purchase_units[0].description = "Supporting Box Pleating Studio";
			purchase_units[0].amount.value = (app.amount + app.extra).toFixed(2);
		},

		createOrder(data, actions) {
			app.processing = true;
			return actions.order.create({ purchase_units });
		},

		onApprove(data, actions) {
			return actions.order.capture().then((details) => {
				if(gtag) {
					gtag('event', 'purchase', {
						"transaction_id": details.id,
						"affiliation": "PayPal",
						"value": app.amount,
						"currency": "USD",
						"shipping": app.extra,
						"items": [
							{
								"id": "default",
								"name": "Supporting Box Pleating Studio",
								"category": "Donation",
								"quantity": 1,
								"price": app.amount,
							},
						],
					});
				}
				app.name = details.payer.name.given_name;
				app.step = 2;
			});
		},

		onCancel(data) {
			app.processing = false;
		},
	}).render('#paypal-button-container');
}

let i18n = new VueI18n({
	locale: 'en',
	fallbackLocale: 'en',
	silentFallbackWarn: true,
	messages: locale,
});
let app = new Vue.options.components.app({ i18n });
app.$mount('#app');

i18n.locale = localStorage.getItem("locale") ?? "en";
document.title = i18n.t("donate.title");
