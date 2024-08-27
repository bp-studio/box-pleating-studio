const $ = require("./proxy");

function esVueOption(options) {
	return {
		templateOptions: {
			compilerOptions: {
				comments: false, // Remove HTML comments
				directiveTransforms: options?.directiveTransforms,
			},
		},
	};
}

// Setting ECMAScript building target
const target = ["es2018", "chrome66", "edge79", "firefox78", "opera53", "safari11.1", "ios11.3"];

function ssgOption(options) {
	const vt = require("@intlify/vue-i18n-extensions").transformVTDirective;
	const esVue = require("@mutsuntsai/esbuild-plugin-vue");
	const VueI18n = require("vue-i18n");
	const i18n = VueI18n.createI18n({
		locale: "en",
		messages: options.messages,
	});
	globalThis.i18n = i18n.global;
	globalThis.Worker = class { };
	return {
		appRoot: options.appRoot,
		appOptions: app => {
			// Avoiding data pollution between builds
			globalThis.localStorage?.clear();
			app.use(i18n);
		},
		esbuildOptions: {
			plugins: [
				esVue(esVueOption({
					directiveTransforms: { t: vt(i18n) }, // So that v-t directives will be processed
				})),
			],
			logLevel: "error", // silence warnings
			target,
		},
	};
}

module.exports = {
	ssgI18n(options) {
		return $.vueSsg(ssgOption(options));
	},
	target,
	extra: __filename,
};
