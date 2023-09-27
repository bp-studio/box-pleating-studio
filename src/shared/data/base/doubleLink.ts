
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

export function link<T>(node: DLNode<T>, prev?: DLNode<T>, next?: DLNode<T>): void {
	node._next = next;
	node._prev = prev;
	if(next) next._prev = node;
	if(prev) prev._next = node;
}
