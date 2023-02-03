import { Design } from "core/design/design";
import { distanceTask } from "core/design/tasks/distance";
import { heightTask } from "core/design/tasks/height";
import { Processor } from "core/service/processor";

import type { JEdge, JEdgeBase, JFlap } from "shared/json";

//=================================================================
/**
 * {@link TreeController} 模組是管理樹狀結構的操作。
 */
//=================================================================
namespace TreeController {

	/** 新增一個葉點 */
	export function addLeaf(id: number, at: number, length: number, flap: JFlap): void {
		const tree = Design.$instance.$tree;
		const node = tree.$addLeaf(id, at, length);
		node.$setFlap(flap);
		Processor.$run(heightTask);
	}

	/**
	 * 逐一刪除葉點
	 * @param ids 要刪除的節點 id
	 * @param prototypes 刪除完之後產生的新葉點對應的 {@link JFlap}
	 */
	export function removeLeaf(ids: number[], prototypes: JFlap[]): void {
		const tree = Design.$instance.$tree;
		while(ids.length) {
			const nodes = ids.map(id => tree.$nodes[id]!);
			ids.length = 0;
			nodes.sort((a, b) => b.$dist - a.$dist);
			for(const node of nodes) {
				if(!tree.$removeLeaf(node.id)) ids.push(node.id);
			}

			if(ids.length) {
				// 如果進入到這邊的話，那就表示請求的刪除涵蓋到了當前的樹根了，因此只能先更新一輪然後再繼續。
				// 這雖然在效能上並非極致最佳，但是實務上這樣的請求幾乎是不會出現的，
				// 這段程式碼主要只是理論上為了正確性而必須加上去的。
				// 此外這個過程可能導致更新模型中被插入了一些垃圾資料，這是 Client 必須留意的。
				Processor.$run(heightTask);
			}
		}

		tree.$setFlaps(prototypes);
		Processor.$run(heightTask);
	}

	export function update(edges: JEdge[]): void {
		const tree = Design.$instance.$tree;
		for(const e of edges) {
			tree.$setLength(getChildId(e), e.length);
		}
		Processor.$run(distanceTask);
	}

	export function join(id: number): void {
		Design.$instance.$tree.$join(id);
		Processor.$run(heightTask);
	}

	export function split(edge: JEdgeBase, id: number): void {
		Design.$instance.$tree.$split(id, getChildId(edge));
		Processor.$run(heightTask);
	}

	export function merge(edge: JEdgeBase): void {
		Design.$instance.$tree.$merge(getChildId(edge));
		Processor.$run(heightTask);
	}

	export function json(): JEdge[] {
		return Design.$instance.$tree.toJSON();
	}

	/** 對於傳入的邊，傳回其中是子點的那一個的 {@link ITreeNode.id id} */
	function getChildId(edge: JEdgeBase): number {
		const tree = Design.$instance.$tree;
		const n1 = tree.$nodes[edge.n1]!, n2 = tree.$nodes[edge.n2]!;
		return n1.$parent === n2 ? edge.n1 : edge.n2;
	}
}

export default TreeController;
