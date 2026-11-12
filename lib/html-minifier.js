import { minify } from "html-minifier";

/**
 * HTML minifier loader.
 *
 * This replaces html-minifier-loader, which is unmaintained and doesn't support
 * html-minifier v5 (which is ESM-only and async).
 * @this {import("@rspack/core").LoaderContext<import("html-minifier").Options>}
 * @param {string} content
 */
export default async function(content) {
	return await minify(content, {
		removeComments: true,
		collapseWhitespace: true,
		...this.getOptions(),
	});
};
