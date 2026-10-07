import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { expect, it } from "@rstest/core";

import { compactLayouts, loadSamples, perturbedLayouts, toParseTree } from "./layouts";
import { inspect, minimize } from "./minimize";
import { drawLayout } from "./svg";
import { drawCases, parseBox } from "./draw";

import type { Issue } from "./checks";
import type { Layout, Sample } from "./layouts";

/*
 * See README.md for the usage. The options are given by environment variables.
 */
const OUT = process.env.OUT ?? "tools/renderCheck/out";
const DEFAULT_SECONDS = 60;
const DEFAULT_MAX_ISSUES = 5;
const SECONDS = Number(process.env.SECONDS ?? DEFAULT_SECONDS);
const SEED = Number(process.env.SEED ?? 1);
const MAX_ISSUES = Number(process.env.MAX_ISSUES ?? DEFAULT_MAX_ISSUES);
const PERTURBATIONS = 20;
const MS_PER_SECOND = 1000;

interface Finding {
	sample: Sample;
	issue: Issue;
	minimized: Layout;
}

it("Checks the rendering of random layouts", async () => {
	mkdirSync(OUT, { recursive: true });
	if(process.env.CASE) {
		const box = process.env.BOX ? parseBox(process.env.BOX) : undefined;
		const trace = process.env.VIEW == "trace";
		const [svg, summary] = drawCases(process.env.CASE, trace, box);
		writeFileSync(join(OUT, "case.svg"), svg);
		writeFileSync(join(OUT, "case.txt"), summary.join("\n") + "\n");
		return;
	}

	const findings: Finding[] = [];
	const seen = new Set<string>();
	let checked = 0;
	const deadline = Date.now() + SECONDS * MS_PER_SECOND;
	for(const sample of generate(await loadSamples())) {
		if(Date.now() > deadline || findings.length >= MAX_ISSUES) break;
		const issues = inspect(sample.layout);
		if(!issues) continue;
		checked++;
		for(const issue of issues) {
			const minimized = minimize(sample.layout, issue.kind);
			const key = issue.kind + toParseTree(minimized);
			if(seen.has(key)) continue;
			seen.add(key);
			findings.push({ sample, issue, minimized });
		}
	}

	writeReport(findings, checked);
	console.log(`Checked ${checked} layouts, found ${findings.length} issue(s).`);
	expect(findings, `See ${join(OUT, "report.md")}`).toHaveLength(0);
});

/** Alternate between the perturbed samples and the compact layouts. */
function* generate(samples: Sample[]): Generator<Sample> {
	yield* samples;
	for(let seed = SEED; ; seed++) {
		for(const sample of samples) {
			yield* perturbedLayouts(sample, seed, PERTURBATIONS);
		}
		yield* compactLayouts(seed);
	}
}

function writeReport(findings: Finding[], checked: number): void {
	const lines = [
		"# Render check report",
		"",
		`Checked ${checked} layouts (seed ${SEED}), found ${findings.length} issue(s).`,
	];
	findings.forEach(({ sample, issue, minimized }, i) => {
		const name = `issue-${i + 1}.svg`;
		const issues = inspect(minimized) ?? [];
		writeFileSync(join(OUT, name), drawLayout(`#${i + 1} ${issue.kind}`, issues));
		lines.push(
			"",
			`## #${i + 1} ${issue.kind}`,
			"",
			`- Found in: ${sample.source}`,
			`- Message: ${issues.find(x => x.kind == issue.kind)?.message ?? issue.message}`,
			`- Picture: [${name}](${name})`,
			"",
			"```ts",
			toParseTree(minimized),
			"```"
		);
	});
	writeFileSync(join(OUT, "report.md"), lines.join("\n") + "\n");
}
