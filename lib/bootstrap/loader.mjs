import { PurgeCSS } from "purgecss";

const key = "css-extract-rspack-plugin";
const app = "./src/app/";
const donate = "./src/other/donate/"
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
	this.addContextDependency(app);
	this.addContextDependency(donate);

	const callback = this.async();
	const json = JSON.parse(meta[key]);
	new PurgeCSS()
		.purge({
			content: compare,
			css: [{ raw: json.content }],
			safelist: {
				standard: [
					/backdrop/,
					/modal-static/,
				],
				variables: [
					"--bs-primary",
					/^--bs-btn-disabled/,
					/^--bs-nav-tabs/,
				],
			},
			variables: true,
		})
		.then(result => {
			json.content = result[0].css;
			meta[key] = JSON.stringify(json);
			callback(null, content, map, meta);
		})
		.catch(err => callback(err));
};
