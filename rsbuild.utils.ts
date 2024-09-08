import { parse } from "yaml";
import { readFileSync } from "fs";

import type { Module } from "@rspack/core";

const yaml = readFileSync("pnpm-lock.yaml").toString();
const json = parse(yaml);

const packages = Object.keys(json.snapshots);
const collected = new Set<string>();

export function makeTest(...tests: (RegExp | null)[]) {
	return (m: Module) => {
		const name = m.nameForCondition();
		for(const test of tests) {
			if(test == null && name == null) return true;
			if(test && test.test(name)) return true;
		}
		return false;
	};
}

export function createDescendantRegExp(...names: string[]) {
	names = names.map(n => resolve(n));
	const list: string[] = [];
	names.forEach(n => listDescendantsRecursive(n, list));
	const descendants = list.map(k => k.match(/^@?[^@]+/)[0]);
	const pattern = "node_modules[\\\\/](" + descendants.map(k => k.replace("/", "[\\\\/]")).join("|") + ")";
	return new RegExp(pattern);
}

function resolve(n: string): string {
	const matches = packages.filter(k => k.startsWith(n + "@"));
	if(matches.length == 0) throw new Error("Package not found: " + n);
	if(matches.length > 1) throw new Error("Package ambiguous: " + matches.join(", "));
	return matches[0];
}

function listDescendantsRecursive(n: string, list: string[]) {
	if(collected.has(n)) return;
	collected.add(n);
	list.push(n);
	const { dependencies } = json.snapshots[n];
	if(!dependencies) return;
	const children = Object.keys(dependencies).map(k => k + "@" + dependencies[k]);
	for(const child of children) {
		listDescendantsRecursive(child, list);
	}
}
