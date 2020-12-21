var Shrewd = require('../dist/Shrewd.js');
var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
        r = Reflect.decorate(decorators, target, key, desc);
    else
        for (var i = decorators.length - 1; i >= 0; i--)
            if (d = decorators[i])
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const {shrewd} = Shrewd;
Shrewd.option.autoCommit = false;
class Disposible {
    constructor(parent) {
        this._disposeConditions = [];
        this._disposed = false;
        if (parent)
            this.addDisposeCondition(() => parent.disposed);
        this._disposeEvent();
    }
    _disposeEvent() {
        if (this._disposed) {
            Shrewd.terminate(this);
            this.onDispose();
        }
    }
    addDisposeCondition(listener) {
        this._disposeConditions.push(listener);
    }
    dispose() {
        this._disposed = true;
    }
    onDispose() {
    }
    get disposed() {
        return this._disposed;
    }
}
__decorate([shrewd], Disposible.prototype, '_disposeConditions', void 0);
__decorate([shrewd({
        renderer(v) {
            for (let listener of this._disposeConditions)
                v = v || listener.apply(this);
            return v;
        }
    })], Disposible.prototype, '_disposed', void 0);
__decorate([shrewd], Disposible.prototype, '_disposeEvent', null);
class Tree extends Disposible {
    constructor() {
        super(...arguments);
        this.node = new Map();
        this.edge = new DoubleMap();
        this.path = new DoubleMapping(() => this.node.values(), (n1, n2) => Shrewd.construct(TreePath, n1, n2));
        this.nextId = 0;
    }
    get leaf() {
        var set = new Set();
        for (let node of this.node.values())
            if (node.degree == 1)
                set.add(node);
        return set;
    }
    generateJID() {
        let arr = Array.from(this.node.values()), i = 0;
        for (let n of arr)
            n.jid = i++;
    }
    dist(n1, n2) {
        let path = this.path.get(n1, n2);
        return path ? path.length : NaN;
    }
    getOrAddNode(n) {
        let N;
        if (this.node.has(n))
            N = this.node.get(n);
        else {
            this.node.set(n, N = new TreeNode(this, n));
            if (n >= this.nextId)
                this.nextId = n + 1;
        }
        return N;
    }
    split(e) {
        let N = this.getOrAddNode(this.nextId);
        this.edge.set(N, e.n1, new TreeEdge(N, e.n1, Math.ceil(e.length / 2)));
        this.edge.set(N, e.n2, new TreeEdge(N, e.n2, Math.max(Math.floor(e.length / 2), 1)));
        this.edge.delete(e.n1, e.n2);
        e.dispose();
        return N;
    }
    deleteAndMerge(e) {
        let N = this.getOrAddNode(this.nextId);
        for (let edge of e.a1) {
            let n = edge.n(e.n1);
            this.edge.set(N, n, new TreeEdge(N, n, edge.length));
        }
        for (let edge of e.a2) {
            let n = edge.n(e.n2);
            this.edge.set(N, n, new TreeEdge(N, n, edge.length));
        }
        e.n1.dispose(true);
        e.n2.dispose(true);
        return N;
    }
    deleteAndJoin(n) {
        let edges = n.edges;
        if (edges.length != 2) {
            console.warn(`Incorrectly calling delete-and-join at [${ n.id }].`);
            return;
        }
        let e1 = edges[0], e2 = edges[1];
        let N1 = e1.n(n), N2 = e2.n(n);
        let edge = new TreeEdge(N1, N2, e1.length + e2.length);
        this.edge.set(N1, N2, edge);
        n.dispose(true);
        return edge;
    }
    addLeafAt(n) {
        let id = this.nextId;
        this.addEdge(n, id, 1);
        return this.node.get(id);
    }
    addEdge(n1, n2, length) {
        let has1 = this.node.has(n1), has2 = this.node.has(n2);
        if (this.node.size != 0 && !has1 && !has2) {
            console.warn(`Adding edge (${ n1 },${ n2 }) disconnects the graph.`);
            return false;
        }
        let N1 = this.getOrAddNode(n1), N2 = this.getOrAddNode(n2);
        if (this.edge.has(N1, N2)) {
            this.edge.get(N1, N2).length = length;
            return false;
        } else if (has1 && has2) {
            console.warn(`Adding edge (${ n1 },${ n2 }) will cause circuit.`);
            return false;
        }
        let edge = new TreeEdge(N1, N2, length);
        this.edge.set(N1, N2, edge);
        return true;
    }
}
__decorate([shrewd({
        renderer(v) {
            for (let [id, node] of v)
                if (node.disposed)
                    v.delete(id);
            return v;
        }
    })], Tree.prototype, 'node', void 0);
__decorate([shrewd({
        renderer(v) {
            for (let node of v.firstKeys())
                if (node.disposed)
                    v.delete(node);
            return v;
        }
    })], Tree.prototype, 'edge', void 0);
__decorate([shrewd], Tree.prototype, 'leaf', null);
class TreeEdge extends Disposible {
    constructor(n1, n2, length) {
        super();
        this.addDisposeCondition(() => n1.disposed || n2.disposed);
        this._n1 = n1;
        this._n2 = n2;
        this.length = length;
    }
    get isRiver() {
        return this.g1.length > 1 && this.g2.length > 1;
    }
    adjacentEdges(n) {
        return n.edges.filter(e => e != this);
    }
    get a1() {
        return this.adjacentEdges(this._n1);
    }
    get a2() {
        return this.adjacentEdges(this._n2);
    }
    group(n, edges) {
        let result = [n];
        for (let edge of edges)
            result.push(...edge.g(n));
        return result;
    }
    get g1() {
        return this.group(this._n1, this.a1);
    }
    get g2() {
        return this.group(this._n2, this.a2);
    }
    g(n) {
        return n == this._n1 ? this.g2 : this.g1;
    }
    get n1() {
        return this._n1;
    }
    get n2() {
        return this._n2;
    }
    n(n) {
        return n == this._n1 ? this._n2 : this._n1;
    }
}
__decorate([shrewd({
        validator(v) {
            return v > 0;
        }
    })], TreeEdge.prototype, 'length', void 0);
__decorate([shrewd], TreeEdge.prototype, 'isRiver', null);
__decorate([shrewd], TreeEdge.prototype, 'a1', null);
__decorate([shrewd], TreeEdge.prototype, 'a2', null);
__decorate([shrewd], TreeEdge.prototype, 'g1', null);
__decorate([shrewd], TreeEdge.prototype, 'g2', null);
class TreePath extends Disposible {
    constructor(n1, n2) {
        super();
        this.addDisposeCondition(() => n1.disposed || n2.disposed);
        this._n1 = n1;
        this._n2 = n2;
    }
    get edges() {
        let result = [];
        let now = this._n1;
        let ok = true;
        while (now != this._n2 && ok) {
            ok = false;
            for (let e of now.edges) {
                if (e.g(now).includes(this._n2)) {
                    ok = true;
                    result.push(e);
                    now = e.n(now);
                    break;
                }
            }
        }
        return result;
    }
    get length() {
        return this.edges.reduce((l, e) => l + e.length, 0);
    }
}
__decorate([shrewd], TreePath.prototype, 'edges', null);
__decorate([shrewd], TreePath.prototype, 'length', null);
class TreeNode extends Disposible {
    constructor(tree, id) {
        super(tree);
        this.name = '';
        this._tree = tree;
        this.id = id;
    }
    dispose(force = false) {
        if (force || this.degree == 1)
            super.dispose();
        else if (this.degree == 2)
            return this._tree.deleteAndJoin(this);
        else if (this.degree != 1)
            console.warn(`Node [${ this.name ? this.name : this.id }] is not a leaf.`);
        return undefined;
    }
    addLeaf() {
        return this._tree.addLeafAt(this.id);
    }
    get edges() {
        let e = this._tree.edge.get(this);
        return e ? Array.from(e.values()) : [];
    }
    get degree() {
        return this.edges.length;
    }
    get firstEdge() {
        return this.edges[0];
    }
    get radius() {
        return this.degree == 1 ? this.edges[0].length : NaN;
    }
}
__decorate([shrewd], TreeNode.prototype, 'name', void 0);
__decorate([shrewd], TreeNode.prototype, 'edges', null);
__decorate([shrewd], TreeNode.prototype, 'degree', null);
__decorate([shrewd], TreeNode.prototype, 'firstEdge', null);
__decorate([shrewd], TreeNode.prototype, 'radius', null);
class DoubleMap {
    constructor() {
        this._map = new Map();
        this._size = 0;
    }
    set(key1, key2, value) {
        if (!this.has(key1, key2)) {
            if (!this._map.has(key1))
                this._map.set(key1, new Map());
            if (!this._map.has(key2))
                this._map.set(key2, new Map());
            this._size++;
        }
        this._map.get(key1).set(key2, value);
        this._map.get(key2).set(key1, value);
        return this;
    }
    get [Symbol.toStringTag]() {
        return 'DoubleMap';
    }
    has(...args) {
        this._size;
        if (args.length == 1)
            return this._map.has(args[0]);
        else
            return this._map.has(args[0]) && this._map.get(args[0]).has(args[1]);
    }
    get(...args) {
        this._size;
        if (args.length == 1)
            return this._map.get(args[0]);
        else if (!this.has(args[0], args[1]))
            return undefined;
        else
            return this._map.get(args[0]).get(args[1]);
    }
    get size() {
        return this._size;
    }
    clear() {
        this._map.clear();
        this._size = 0;
    }
    forEach(callbackfn, thisArg) {
        if (!thisArg)
            thisArg = this;
        for (let [k1, k2, v] of this.entries())
            callbackfn.apply(thisArg, [
                v,
                k1,
                k2,
                this
            ]);
    }
    delete(...args) {
        if (args.length == 1) {
            if (!this._map.has(args[0]))
                return false;
            this._size -= this._map.get(args[0]).size;
            this._map.delete(args[0]);
            for (let m of this._map.values())
                m.delete(args[0]);
            return true;
        } else {
            if (!this.has(args[0], args[1]))
                return false;
            this._map.get(args[0]).delete(args[1]);
            this._map.get(args[1]).delete(args[0]);
            this._size--;
            return true;
        }
    }
    [Symbol.iterator]() {
        return this.entries();
    }
    *entries() {
        for (let [k1, k2] of this.keys())
            yield [
                k1,
                k2,
                this.get(k1, k2)
            ];
    }
    *keys() {
        this._size;
        let temp = new Map();
        for (let k1 of this._map.keys()) {
            temp.set(k1, new Set());
            for (let k2 of this._map.get(k1).keys()) {
                if (temp.has(k2) && temp.get(k2).has(k1))
                    continue;
                temp.get(k1).add(k2);
                yield [
                    k1,
                    k2
                ];
            }
        }
    }
    firstKeys() {
        this._size;
        return this._map.keys();
    }
    *values() {
        for (let [k1, k2] of this.keys())
            yield this.get(k1, k2);
    }
}
__decorate([shrewd], DoubleMap.prototype, '_size', void 0);
class DoubleMapping {
    constructor(source, constructor) {
        this._map = new DoubleMap();
        this._source = source;
        this._constructor = constructor;
        this.map();
    }
    map() {
        for (let key of this._map.firstKeys()) {
            if (key.disposed)
                this._map.delete(key);
        }
        let source = [...this._source()];
        if (source.length > 1 && this._map.size == 0) {
            this._map.set(source[0], source[1], this._constructor(source[0], source[1]));
        }
        for (let key of source) {
            if (!this._map.has(key)) {
                let keys = Array.from(this._map.firstKeys());
                for (let k of keys)
                    this._map.set(key, k, this._constructor(key, k));
            }
        }
        return this._map;
    }
    has(...args) {
        return this.map().has.apply(this._map, args);
    }
    get(...args) {
        return this.map().get.apply(this._map, args);
    }
    get size() {
        return this._map.size;
    }
    forEach(callbackfn, thisArg) {
        return this.map().forEach(callbackfn, thisArg);
    }
    [Symbol.iterator]() {
        return this.map()[Symbol.iterator]();
    }
    entries() {
        return this.map().entries();
    }
    keys() {
        return this.map().keys();
    }
    firstKeys() {
        return this.map().firstKeys();
    }
    values() {
        return this.map().values();
    }
}
__decorate([shrewd({ lazy: true })], DoubleMapping.prototype, 'map', null);
class UnitTest {
    static run(tests) {
        let assert = console.assert;
        let warn = console.warn;
        let pass = true;
        console.assert = (a, ...obj) => {
            assert(a, ...obj);
            if (!a)
                throw true;
        };
        console.warn = m => {
            if (UnitTest.consoleHack)
                UnitTest.warnings.push(m);
            else
                warn(m);
        };
        for (let test of tests) {
            try {
                UnitTest.warnings = [];
                this.consoleHack = false;
                test();
            } catch (e) {
                if (e instanceof Error)
                    console.error(e);
                console.log(`\x1b[31m${ test.name } : failed\x1b[0m`);
                pass = false;
            }
        }
        if (pass)
            console.log('\x1B[32mAll tests succeeded.\x1B[0m');
        console.assert = assert;
        console.warn = warn;
    }
}
UnitTest.run([
    TreeBasic,
    DoubleMapBasic,
    DoubleMapReact
]);
function DoubleMapBasic() {
    let m = new DoubleMap();
    m.set('a', 'b', 2);
    console.assert(m.has('a', 'b') && m.has('b', 'a'));
    console.assert(m.get('b', 'a') == 2);
    m.set('a', 'c', 3);
    console.assert(m.size == 2);
    console.assert(!m.has('b', 'c'));
    m.set('c', 'c', 5);
    console.assert(m.size == 3);
    let n = 1;
    for (let [k1, k2, v] of m)
        n *= v;
    console.assert(n == 30);
    m.delete('c', 'a');
    console.assert(!m.has('a', 'c'));
    console.assert(m.size == 2);
}
function DoubleMapReact() {
    class A {
        constructor() {
            this.map = new DoubleMap();
            this.has();
        }
        has() {
            log.add('has');
            this.map.has('a');
        }
    }
    __decorate([shrewd], A.prototype, 'has', null);
    var log = new Set();
    function getLog() {
        let result = [...log].sort().join(',');
        log.clear();
        return result;
    }
    var a = new A();
    getLog();
    a.map.set('a', 'b', 12);
    Shrewd.commit();
    console.log(getLog());
}
function TreeBasic() {
    let t = new Tree();
    t.addEdge(1, 0, 2);
    t.addEdge(0, 2, 1);
    Shrewd.commit();
    let A = t.node.get(1), B = t.node.get(2), a = t.node.get(0);
    console.assert(t.node.size == 3 && A != undefined && B != undefined && a != undefined, t.node);
    console.assert(t.leaf.size == 2 && t.leaf.has(A) && t.leaf.has(B), t.leaf);
    console.assert(a.degree == 2, a);
    console.assert(t.edge.get(a, B).length == 1, a);
    console.assert(t.edge.size == 2, t);
    console.assert(t.dist(A, B) == 3, t.path.get(A, B));
    t.addEdge(0, 2, 4);
    t.addEdge(0, 3, 3);
    let C = t.node.get(3);
    Shrewd.commit();
    console.assert(t.node.size == 4 && t.leaf.size == 3);
    console.assert(a.degree == 3, '度數正確', a.degree);
    console.assert(t.edge.get(a, B).length == 4, '應該要更新為新的長度');
    console.assert(t.edge.size == 3);
    console.assert(t.dist(A, B) == 6, 'AB 長度為 6', t.path.get(A, B));
    UnitTest.consoleHack = true;
    t.addEdge(1, 2, 5);
    t.addEdge(4, 5, 1);
    a.dispose();
    Shrewd.commit();
    console.assert(UnitTest.warnings.length == 3);
    console.assert(UnitTest.warnings[0] == 'Adding edge (1,2) will cause circuit.');
    console.assert(UnitTest.warnings[1] == 'Adding edge (4,5) disconnects the graph.');
    console.assert(UnitTest.warnings[2] == 'Node [0] is not a leaf.');
    let P = t.path.get(A, C);
    let E = t.edge.get(C, a);
    console.assert(!P.disposed && !E.disposed && !C.disposed);
    C.dispose();
    Shrewd.commit();
    console.assert(C.disposed && P.disposed && E.disposed, '要正確解構', C.disposed, P.disposed, E.disposed);
    console.assert(t.node.size == 3 && t.leaf.size == 2, t);
    t.dispose();
}
//# sourceMappingURL=test.js.map
