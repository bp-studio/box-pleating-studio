
type DLNode<T> = T & IDoubleLinkedNode<T>;

export interface IDoubleLinkedNode<T> {
	_prev?: DLNode<T>;
	_next?: DLNode<T>;
}

export function unlink<T>(
	node: DLNode<T>,
	noPrevCallback?: (next?: DLNode<T>) => void
): void {
	const prev = node._prev, next = node._next;
	if(prev) prev._next = next;
	else if(noPrevCallback) noPrevCallback(next);
	if(next) next._prev = prev;
}
