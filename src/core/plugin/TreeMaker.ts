/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable no-throw-literal */
/* eslint-disable max-classes-per-file */

import { Fraction, MathUtil } from "bp/math";
import { Migration } from "bp/content/patches";
import type { JDesign, JSheet, JVertex } from "bp/content/json";

/** @exports */
export function parse(title: string, data: string): JDesign {
	try {
		let v = new TreeMakerVisitor(data);
		let { $result } = new TreeMakerParser(v);
		$result.title = title;
		return $result;
	} catch(e) {
		if(typeof e == "string") throw new Error(e);
		else throw new Error(t("plugin.TreeMaker.invalid"));
	}
}

/** This dummy function marks the usage of translation */
function t(message: string): string { return message; }

/** 負責逐列處理 TreeMaker 檔案的內容 */
class TreeMakerVisitor {
	private _lines: IterableIterator<string>;

	constructor(data: string) {
		this._lines = data.split('\n').values();
	}

	public $next(): string { return (this._lines.next().value as string).trim(); }
	public get $int(): number { return parseInt(this.$next(), 10); }
	public get $float(): number { return parseFloat(this.$next()); }
	public get $bool(): boolean { return this.$next() == "true"; }

	public $skip(n: number): void { for(let i = 0; i < n; i++) this._lines.next(); }
	public $skipArray(): void { this.$skip(this.$int); }
}

/** 負責解析 TreeMaker 5 的檔案格式 */
class TreeMakerParser {
	public $result: JDesign = Migration.$getSample();
	private _visitor: TreeMakerVisitor;
	private _set: Set<number> = new Set();

	constructor(v: TreeMakerVisitor) {
		this._visitor = v;

		if(v.$next() != "tree" || v.$next() != "5.0") throw t("plugin.TreeMaker.not5");
		let width = v.$float, height = v.$float;
		let scale = 1 / v.$float;

		v.$skip(11);
		let numNode = v.$int, numEdge = v.$int;

		v.$skip(6);
		for(let i = 0; i < numNode; i++) this._parseNode();
		for(let i = 0; i < numEdge; i++) this._parseEdge();

		let fix = MathUtil.$LCM(Array.from(this._set));
		let sw = Math.ceil(width * scale * fix - 0.25);
		let sh = Math.ceil(height * scale * fix - 0.25);
		if(sw < 8 || sh < 8) throw t("plugin.TreeMaker.size8");

		let fx = sw / width;
		let fy = sh / height;

		for(let f of this.$result.layout.flaps) {
			f.x = Math.round(f.x * fx);
			f.y = Math.round(f.y * fy);
		}
		for(let n of this.$result.tree.nodes) {
			n.x = Math.round(n.x * fx);
			n.y = Math.round(n.y * fy);
		}
		for(let e of this.$result.tree.edges) {
			e.length = Math.max(Math.round(e.length * fix), 1);
		}

		let sheet: JSheet = { width: sw, height: sh };
		this.$result.layout.sheet = sheet;
		this.$result.tree.sheet = sheet;
	}

	private _parseNode(): void {
		let v = this._visitor;
		if(v.$next() != "node") throw new Error();
		let vertex: JVertex = {
			id: v.$int,
			name: v.$next(),
			x: v.$float,
			y: v.$float,
		};

		v.$skip(2);
		if(v.$bool) { // isLeafNode
			this.$result.layout.flaps.push({
				id: vertex.id,
				x: vertex.x,
				y: vertex.y,
				height: 0,
				width: 0,
			});
		}
		this.$result.tree.nodes.push(vertex);

		v.$skip(6);
		v.$skipArray();
		v.$skipArray();
		v.$skipArray();
		if(v.$next() == "1") v.$next();
	}

	private _parseEdge(): void {
		let v = this._visitor;
		if(v.$next() != "edge") throw new Error();
		v.$skip(2);
		let length = v.$float;
		this._set.add(Number(Fraction.$toFraction(length, 1, 0, 0.1).$denominator));
		this.$result.tree.edges.push({
			length: length * (1 + v.$float),
			n1: (v.$skip(4), v.$int),
			n2: v.$int,
		});
	}
}
