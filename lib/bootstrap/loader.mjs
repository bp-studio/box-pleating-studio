import { PurgeCSS } from "purgecss";

const app = "./src/app/";
const donate = "./src/other/donate/";
const compare = [
	app + "**/*.vue",
	app + "**/*.scss",
	app + "**/*.htm",
	donate + "**/*.vue",
	donate + "**/*.htm",
];

/**
 * Apply PurgeCSS to the bundled Bootstrap
 * @type {import("@rspack/core").LoaderDefinitionFunction}
 */
export default function(content, map, meta) {
	const callback = this.async();
	if(!this.resourcePath.match(/lib[\\/]bootstrap[\\/]bootstrap.scss$/)) {
		callback(null, content, map, meta);
		return;
	}

	this.addContextDependency(app);
	this.addContextDependency(donate);

	new PurgeCSS()
		.purge({
			content: compare,
			css: [{ raw: content }],
			safelist: {
				standard: [
					/backdrop/,
					/modal-static/,
				],
				variables: [
					"--bs-primary",
					"--bs-black",
					/^--bs-gray/,
					/^--bs-btn-disabled/,
					/^--bs-nav-tabs/,
				],
				greedy: [
					/tooltip-arrow/,
				],
			},
			variables: true,
		})
		.then(result => {
			callback(null, result[0].css, undefined, meta);
		})
		.catch(err => callback(err));
};
