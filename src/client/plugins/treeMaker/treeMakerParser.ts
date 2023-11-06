/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Migration } from "client/patches/migration";
import { $LCM } from "core/math/utils/gcd";
import { GridType } from "shared/json";
import { toFractionRecursive } from "core/math/fraction";
import { t } from "../i18n";

import type { TreeMakerVisitor } from "./treeMakerVisitor";
import type { JSheet, JVertex } from "shared/json/components";
import type { JProject } from "shared/json/project";

//=================================================================
/**
 * {@link TreeMakerParser} parses the file format of TreeMaker 5.
 */
//=================================================================
export class TreeMakerParser {
	public $result: JProject = Migration.$getSample();
	private _visitor: TreeMakerVisitor;
	private _set: Set<Positive> = new Set();

	constructor(v: TreeMakerVisitor) {
		this._visitor = v;

		if(v.$next() != "tree" || v.$next() != "5.0") throw t("plugin.TreeMaker.not5");
		const width = v.$float, height = v.$float;
		const scale = 1 / v.$float;

		v.$skip(11);
		const numNode = v.$int, numEdge = v.$int;

		v.$skip(6);
		for(let i = 0; i < numNode; i++) this._parseNode();
		for(let i = 0; i < numEdge; i++) this._parseEdge();

		const fix = $LCM(Array.from(this._set));
		const sw = Math.ceil(width * scale * fix - 0.25);
		const sh = Math.ceil(height * scale * fix - 0.25);
		if(sw < 8 || sh < 8) throw t("plugin.TreeMaker.size8");

		const fx = sw / width;
		const fy = sh / height;

		for(const f of this.$result.design.layout.flaps) {
			f.x = Math.round(f.x * fx);
			f.y = Math.round(f.y * fy);
		}
		for(const n of this.$result.design.tree.nodes) {
			n.x = Math.round(n.x * fx);
			n.y = Math.round(n.y * fy);
		}
		for(const e of this.$result.design.tree.edges) {
			e.length = Math.max(Math.round(e.length * fix), 1);
		}

		const sheet: JSheet = { type: GridType.rectangular, width: sw, height: sh };
		this.$result.design.layout.sheet = sheet;
		this.$result.design.tree.sheet = sheet;
	}

	private _parseNode(): void {
		const v = this._visitor;
		if(v.$next() != "node") throw new Error();
		const vertex: JVertex = {
			id: v.$int,
			name: v.$next(),
			x: v.$float,
			y: v.$float,
		};

		v.$skip(2);
		if(v.$bool) { // isLeafNode
			this.$result.design.layout.flaps.push({
				id: vertex.id,
				x: vertex.x,
				y: vertex.y,
				height: 0,
				width: 0,
			});
		}
		this.$result.design.tree.nodes.push(vertex);

		v.$skip(6);
		v.$skipArray();
		v.$skipArray();
		v.$skipArray();
		if(v.$next() == "1") v.$next();
	}

	private _parseEdge(): void {
		const v = this._visitor;
		if(v.$next() != "edge") throw new Error();
		v.$skip(2);
		const length = v.$float;
		this._set.add(toFractionRecursive(length, 1, 0, 0.1).$denominator);
		this.$result.design.tree.edges.push({
			length: length * (1 + v.$float),
			n1: (v.$skip(4), v.$int),
			n2: v.$int,
		});
	}
}
