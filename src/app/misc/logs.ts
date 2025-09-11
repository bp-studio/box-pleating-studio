///<reference types="@rspack/core/module.d.ts" />

/**
 * Import all log files.
 * @see https://rspack.dev/api/runtime-api/module-variables#importmetawebpackcontext
 */
const context = import.meta.webpackContext("../../log", { regExp: /\d+\.md$/ });

/** Urls of all log files in order. */
const files = context.keys().map(context) as string[];

/** Log numbers in order. */
const logs = files.map(f => Number(f.match(/\d+/)![0]));

export default logs;
