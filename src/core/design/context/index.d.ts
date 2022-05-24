import type { JEdge, JFlap } from "shared/json";

export interface ITree extends ISerializable<JEdge[]> {
	readonly $nodes: ReadonlyMap<number, ITreeNode>;

	/** 增加一個新的葉點並且傳回新節點的 {@link ITreeNode.id id} */
	$addLeaf(at: number, length: number): number;

	/** 刪除一個指定 {@link ITreeNode.id id} 的葉點，並傳回成功與否 */
	$removeLeaf(id: number): boolean;

	/** 傳回兩個節點在樹上的距離 */
	$dist(n1: ITreeNode, n2: ITreeNode): number;

	/** 建構所有的輪廓 */
	$buildContour(): void;
}

export interface ITreeNode extends ISerializable<JEdge> {
	readonly id: number;
	readonly $length: number;
}
