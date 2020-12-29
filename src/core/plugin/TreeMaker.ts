
namespace TreeMaker {

	export function parse(title: string, data: string): JDesign {
		try {
			let v = new TreeMakerVisitor(data);
			let { result } = new TreeMakerParser(v);
			result.title = title;
			return result;
		} catch(e) {
			if(typeof e == "string") throw new Error(e);
			else throw new Error("plugin.TreeMaker.invalid");
		}
	}

	class TreeMakerVisitor {
		private lines: IterableIterator<string>;

		constructor(data: string) {
			this.lines = data.split('\n').values();
		}

		public get next() {	return this.lines.next().value;	}
		public get int() { return parseInt(this.next); }
		public get float() { return parseFloat(this.next); }
		public get bool() { return this.next == "true"; }

		public skip(n: number) { for(let i = 0; i < n; i++) this.lines.next(); }
		public skipArray() { this.skip(this.int); }
	}

	class TreeMakerParser {
		public result: JDesign = Migration.getSample();
		private _visitor: TreeMakerVisitor;
		private fx: number;
		private fy: number;

		constructor(v: TreeMakerVisitor) {
			this._visitor = v;

			if(v.next != "tree" || v.next != "5.0") throw "plugin.TreeMaker.not5";

			let width = v.float, height = v.float;
			let scale = 1 / v.float;
			let sw = Math.ceil(width * scale - 0.25);
			let sh = Math.ceil(height * scale - 0.25);
			if(sw < 8 || sh < 8) throw "plugin.TreeMaker.size8";

			this.fx = sw / width;
			this.fy = sh / height;

			v.skip(11);
			let numNode = v.int, numEdge = v.int;

			v.skip(6);
			for(let i = 0; i < numNode; i++) this.parseNode();
			for(let i = 0; i < numEdge; i++) this.parseEdge();

			let sheet: JSheet = { width: sw, height: sh, scale: 20 };
			this.result.layout.sheet = sheet;
			this.result.tree.sheet = sheet;
		}

		private parseNode() {
			let v = this._visitor;
			if(v.next != "node") throw new Error();
			let vertex: JVertex = {
				id: v.int,
				name: v.next,
				x: Math.round(v.float * this.fx),
				y: Math.round(v.float * this.fy),
			};

			v.skip(2);
			if(v.bool) { // isLeafNode
				this.result.layout.flaps.push({
					id: vertex.id,
					x: vertex.x,
					y: vertex.y,
					height: 0,
					width: 0
				});
			}
			this.result.tree.nodes.push(vertex);

			v.skip(6);
			v.skipArray();
			v.skipArray();
			v.skipArray();
			if(v.next == "1") v.next;
		}

		private parseEdge() {
			let v = this._visitor;
			if(v.next != "edge") throw new Error();
			v.skip(2);
			this.result.tree.edges.push({
				length: Math.round(v.float),
				n1: (v.skip(5), v.int),
				n2: v.int
			});
		}
	}
}
