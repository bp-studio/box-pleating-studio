function initPayPalButton() {
	var purchase_units = [];
	purchase_units[0] = {};
	purchase_units[0].amount = {};

	paypal.Buttons({
		style: {
			color: 'gold',
			shape: 'pill',
			label: 'paypal',
			layout: 'horizontal',
		},

		onInit: function(data, actions) {
			app.init(actions);
		},

		onClick: function() {
			purchase_units[0].description = "Supporting Box Pleating Studio";
			purchase_units[0].amount.value = (app.amount + app.extra).toFixed(2);
		},

		createOrder: function(data, actions) {
			app.processing = true;
			return actions.order.create({ purchase_units: purchase_units });
		},

		onApprove: function(data, actions) {
			return actions.order.capture().then(function(details) {
				if(gtag) gtag('event', 'purchase', {
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
						  "price": app.amount
						}
					]
				});
				app.name = details.payer.name.given_name;
				app.step = 2;
			});
		},

		onCancel: function(data) {
			app.processing = false;
		}
	}).render('#paypal-button-container');
}

var i18n = new VueI18n({
	locale: 'en',
	fallbackLocale: 'en',
	silentFallbackWarn: true,
	messages: locale
});
var app = new Vue.options.components['app']({ i18n });
app.$mount('#app');

let settings = JSON.parse(localStorage.getItem("settings"));
if(settings) i18n.locale = settings.locale ?? "en";
document.title = i18n.t("donate.title");
