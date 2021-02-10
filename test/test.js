let Shrewd = require('../dist/shrewd.min.js');
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
const action = shrewd;
let Disposable = class Disposable {
    constructor(parent) {
        this._disposed = false;
        this._disposeWith = parent;
    }
    disposeEvent() {
        if (this._disposed) {
            Shrewd.terminate(this);
            this.onDispose();
        }
    }
    get shouldDispose() {
        return this._disposeWith ? this._disposeWith._disposed : false;
    }
    dispose() {
        this._disposed = true;
    }
    onDispose() {
        delete this._disposeWith;
    }
    get disposed() {
        return this._disposed;
    }
};
__decorate([shrewd({
        renderer(v) {
            return v || this.shouldDispose;
        }
    })], Disposable.prototype, '_disposed', void 0);
__decorate([shrewd], Disposable.prototype, 'disposeEvent', null);
Disposable = __decorate([shrewd], Disposable);
let Tree = class Tree extends Disposable {
    constructor(design, edges) {
        super(design);
        this.node = new Map();
        this.edge = new DoubleMap();
        this.nextId = 0;
        this._jid = false;
        this.pair = new DoubleMapping(() => this.node.values(), (n1, n2) => new TreePair(n1, n2));
        this.design = design;
        while (edges === null || edges === void 0 ? void 0 : edges.length) {
            let remain = [], ok = false;
            for (let e of edges) {
                if (this.addEdge(e.n1, e.n2, e.length))
                    ok = true;
                else {
                    remain.push(e);
                }
            }
            if (!ok)
                break;
            edges = remain;
        }
    }
    onDispose() {
        Shrewd.terminate(this.edge);
        this.pair.dispose();
    }
    get leaf() {
        var set = new Set();
        for (let node of this.node.values())
            if (node.degree == 1)
                set.add(node);
        return set;
    }
    withJID(action) {
        let arr = Array.from(this.node.values()).sort((a, b) => a.id - b.id), i = 0;
        for (let n of arr)
            TreeNode.setJID(n, i++);
        this._jid = true;
        action();
        this._jid = false;
    }
    get jid() {
        return this._jid;
    }
    dist(n1, n2) {
        this.disposeEvent();
        if (n1 == n2)
            return 0;
        return this.pair.get(n1, n2).dist;
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
        let {n1, n2} = e;
        if (n1.parent == n2)
            [n1, n2] = [
                n2,
                n1
            ];
        N.parent = n1;
        n2.parent = N;
        this.edge.delete(n1, n2);
        this.edge.set(N, n1, new TreeEdge(N, n1, Math.ceil(e.length / 2)));
        this.edge.set(N, n2, new TreeEdge(N, n2, Math.max(Math.floor(e.length / 2), 1)));
        e.dispose();
        return N;
    }
    deleteAndMerge(e) {
        let N = this.getOrAddNode(this.nextId);
        let {n1, n2, a1, a2} = e;
        if (n1.parent == n2) {
            [n1, n2] = [
                n2,
                n1
            ];
            [a1, a2] = [
                a2,
                a1
            ];
        }
        N.parent = n1.parent;
        this.edge.delete(n1, n2);
        for (let edge of a1) {
            let n = edge.n(n1);
            if (n != N.parent)
                n.parent = N;
            this.edge.delete(n, n1);
            this.edge.set(N, n, new TreeEdge(N, n, edge.length));
        }
        for (let edge of a2) {
            let n = edge.n(n2);
            n.parent = N;
            this.edge.delete(n, n2);
            this.edge.set(N, n, new TreeEdge(N, n, edge.length));
        }
        n1.dispose(true);
        n2.dispose(true);
        return N;
    }
    deleteAndJoin(n) {
        let edges = n.edges;
        if (edges.length != 2) {
            console.warn(`Incorrectly calling delete-and-join at [${ n.id }].`);
            return;
        }
        let e1 = edges[0], e2 = edges[1];
        let n1 = e1.n(n), n2 = e2.n(n);
        if (n.parent == n2)
            [n1, n2] = [
                n2,
                n1
            ];
        n2.parent = n1;
        let edge = new TreeEdge(n1, n2, e1.length + e2.length);
        this.edge.set(n1, n2, edge);
        n.dispose(true);
        return edge;
    }
    addLeafAt(n, length) {
        let id = this.nextId;
        this.addEdge(n, id, length);
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
        if (has1)
            N2.parent = N1;
        else if (has2)
            N1.parent = N2;
        else if (n1 < n2)
            N2.parent = N1;
        else
            N1.parent = N2;
        let edge = new TreeEdge(N1, N2, length);
        this.edge.set(N1, N2, edge);
        return true;
    }
    distTriple(n1, n2, n3) {
        let d12 = this.dist(n1, n2);
        let d13 = this.dist(n1, n3);
        let d23 = this.dist(n2, n3);
        let total = (d12 + d13 + d23) / 2;
        return {
            d1: total - d23,
            d2: total - d13,
            d3: total - d12
        };
    }
};
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
Tree = __decorate([shrewd], Tree);
let TreeEdge = class TreeEdge extends Disposable {
    constructor(n1, n2, length) {
        super();
        this._n1 = n1;
        this._n2 = n2;
        this.length = length;
    }
    get tag() {
        return 'e' + this._n1.id + '-' + this._n2.id;
    }
    get design() {
        return this.n1.design;
    }
    get shouldDispose() {
        return super.shouldDispose || this._n1.disposed || this._n2.disposed;
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
    get l1() {
        return this.g1.filter(n => n.degree == 1);
    }
    get l2() {
        return this.g2.filter(n => n.degree == 1);
    }
    get t1() {
        return this.a1.map(e => e.t(this._n1) + e.length).reduce((n, x) => n + x, 0);
    }
    get t2() {
        return this.a2.map(e => e.t(this._n2) + e.length).reduce((n, x) => n + x, 0);
    }
    t(n) {
        return n == this._n1 ? this.t2 : this.t1;
    }
    get p1() {
        return Math.max(...this.l1.map(n => n.tree.dist(n, this.n1)));
    }
    get p2() {
        return Math.max(...this.l2.map(n => n.tree.dist(n, this.n2)));
    }
    get wrapSide() {
        if (!this.isRiver)
            return 0;
        if (this.p1 > this.p2)
            return 2;
        if (this.p1 < this.p2)
            return 1;
        if (this.t1 > this.t2)
            return 2;
        if (this.t1 < this.t2)
            return 1;
        if (this.g1.length > this.g2.length)
            return 1;
        if (this.g1.length < this.g2.length)
            return 2;
        return 0;
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
};
__decorate([action({ validator: v => v > 0 })], TreeEdge.prototype, 'length', void 0);
__decorate([shrewd], TreeEdge.prototype, 'isRiver', null);
__decorate([shrewd], TreeEdge.prototype, 'a1', null);
__decorate([shrewd], TreeEdge.prototype, 'a2', null);
__decorate([shrewd], TreeEdge.prototype, 'g1', null);
__decorate([shrewd], TreeEdge.prototype, 'g2', null);
__decorate([shrewd], TreeEdge.prototype, 'l1', null);
__decorate([shrewd], TreeEdge.prototype, 'l2', null);
__decorate([shrewd], TreeEdge.prototype, 't1', null);
__decorate([shrewd], TreeEdge.prototype, 't2', null);
__decorate([shrewd], TreeEdge.prototype, 'p1', null);
__decorate([shrewd], TreeEdge.prototype, 'p2', null);
__decorate([shrewd], TreeEdge.prototype, 'wrapSide', null);
TreeEdge = __decorate([shrewd], TreeEdge);
let TreePair = class TreePair extends Disposable {
    constructor(n1, n2) {
        super();
        this._n1 = n1;
        this._n2 = n2;
    }
    get shouldDispose() {
        return super.shouldDispose || this._n1.disposed || this._n2.disposed;
    }
    get lca() {
        this.disposeEvent();
        let [n1, n2] = [
            this._n1,
            this._n2
        ];
        if (n1.depth < n2.depth)
            [n1, n2] = [
                n2,
                n1
            ];
        if (n2.depth == 0)
            return n2;
        while (n1.depth > n2.depth)
            n1 = n1.parent;
        if (n1 == n2)
            return n1;
        let a1 = n1.parent, a2 = n2.parent;
        if (a1 == a2)
            return a1;
        return n1.tree.pair.get(a1, a2).lca;
    }
    get dist() {
        return this._n1.dist + this._n2.dist - 2 * this.lca.dist;
    }
};
__decorate([shrewd], TreePair.prototype, 'lca', null);
TreePair = __decorate([shrewd], TreePair);
let TreeNode = class TreeNode extends Disposable {
    constructor(tree, id) {
        super(tree);
        this.name = '';
        this.parent = null;
        this.tree = tree;
        this._id = id;
    }
    static setJID(n, id) {
        n._jid = id;
    }
    get tag() {
        return 'n' + this.id;
    }
    get id() {
        return this.tree.jid ? this._jid : this._id;
    }
    get parentEdge() {
        var _a;
        if (!this.parent)
            return null;
        return (_a = this.tree.edge.get(this, this.parent)) !== null && _a !== void 0 ? _a : null;
    }
    get dist() {
        if (!this.parentEdge)
            return 0;
        return this.parentEdge.length + this.parent.dist;
    }
    get depth() {
        if (!this.parent)
            return 0;
        return this.parent.depth + 1;
    }
    get shouldDispose() {
        return super.shouldDispose || this.tree.disposed;
    }
    dispose(force = false) {
        if (force || this.degree == 1)
            super.dispose();
        else if (this.degree == 2)
            return this.tree.deleteAndJoin(this);
        else if (this.degree != 1)
            console.warn(`Node [${ this.name ? this.name : this.id }] is not a leaf.`);
        return undefined;
    }
    addLeaf(length) {
        return this.tree.addLeafAt(this.id, length);
    }
    get design() {
        return this.tree.design;
    }
    get edges() {
        this.disposeEvent();
        let e = this.tree.edge.get(this);
        return e ? Array.from(e.values()) : [];
    }
    get degree() {
        return this.edges.length;
    }
    get leafEdge() {
        return this.degree == 1 ? this.edges[0] : null;
    }
    get radius() {
        var _a, _b;
        return (_b = (_a = this.leafEdge) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : NaN;
    }
};
__decorate([action], TreeNode.prototype, 'name', void 0);
__decorate([shrewd({
        renderer(n) {
            return n && n.disposed ? null : n;
        }
    })], TreeNode.prototype, 'parent', void 0);
__decorate([shrewd], TreeNode.prototype, 'parentEdge', null);
__decorate([shrewd], TreeNode.prototype, 'dist', null);
__decorate([shrewd], TreeNode.prototype, 'depth', null);
__decorate([shrewd], TreeNode.prototype, 'edges', null);
__decorate([shrewd], TreeNode.prototype, 'degree', null);
__decorate([shrewd], TreeNode.prototype, 'leafEdge', null);
__decorate([shrewd], TreeNode.prototype, 'radius', null);
TreeNode = __decorate([shrewd], TreeNode);
class BaseMapping {
    constructor(source, keyGen, ctor, dtor) {
        this.source = source;
        this.keyGen = keyGen;
        this.ctor = ctor;
        this.dtor = dtor;
        this._map = new Map();
    }
    dispose() {
        Shrewd.terminate(this);
        this._map.clear();
        delete this._map;
    }
    render() {
        for (let [key, value] of this._map) {
            if (this.dtor(key, value))
                this._map.delete(key);
        }
        for (let group of this.source()) {
            let key = this.keyGen(group);
            if (!this._map.has(key))
                this._map.set(key, this.ctor(group));
        }
        return new Map(this._map);
    }
    get(key) {
        return this.render().get(key);
    }
    has(key) {
        return this.render().has(key);
    }
    forEach(callbackfn, thisArg) {
        return this.render().forEach(callbackfn, thisArg);
    }
    get size() {
        return this.render().size;
    }
    [Symbol.iterator]() {
        return this.render()[Symbol.iterator]();
    }
    entries() {
        return this.render().entries();
    }
    keys() {
        return this.render().keys();
    }
    values() {
        return this.render().values();
    }
    toJSON() {
        return Array.from(this.values()).map(v => v.toJSON());
    }
}
__decorate([shrewd], BaseMapping.prototype, 'render', null);
let DoubleMap = class DoubleMap {
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
};
__decorate([shrewd], DoubleMap.prototype, '_size', void 0);
DoubleMap = __decorate([shrewd], DoubleMap);
let DoubleMapping = class DoubleMapping {
    constructor(source, constructor) {
        this._source = source;
        this._constructor = constructor;
        this._map = new DoubleMap();
    }
    dispose() {
        Shrewd.terminate(this);
        Shrewd.terminate(this._map);
    }
    has(...args) {
        return this._map.has.apply(this._map, args);
    }
    get(...args) {
        return this._map.get.apply(this._map, args);
    }
    get size() {
        return this._map.size;
    }
    forEach(callbackfn, thisArg) {
        return this._map.forEach(callbackfn, thisArg);
    }
    [Symbol.iterator]() {
        return this._map[Symbol.iterator]();
    }
    entries() {
        return this._map.entries();
    }
    keys() {
        return this._map.keys();
    }
    firstKeys() {
        return this._map.firstKeys();
    }
    values() {
        return this._map.values();
    }
};
__decorate([shrewd({
        renderer(map) {
            for (let key of map.firstKeys()) {
                if (key.disposed)
                    map.delete(key);
            }
            let source = Array.from(this._source());
            if (source.length > 1 && map.size == 0) {
                map.set(source[0], source[1], this._constructor(source[0], source[1]));
            }
            for (let key of source) {
                if (!map.has(key)) {
                    let keys = Array.from(map.firstKeys());
                    for (let k of keys)
                        map.set(key, k, this._constructor(key, k));
                }
            }
            return map;
        }
    })], DoubleMapping.prototype, '_map', void 0);
DoubleMapping = __decorate([shrewd], DoubleMapping);
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
    let t = new Tree(null);
    t.addEdge(1, 0, 2);
    t.addEdge(0, 2, 1);
    Shrewd.commit();
    let A = t.node.get(1), B = t.node.get(2), a = t.node.get(0);
    let out;
    console.assert(t.node.size == 3 && A != undefined && B != undefined && a != undefined, t.node);
    console.assert(t.leaf.size == 2 && t.leaf.has(A) && t.leaf.has(B), t.leaf);
    console.assert(a.degree == 2, a);
    console.assert(t.edge.get(a, B).length == 1, a);
    console.assert(t.edge.size == 2, t);
    console.assert((out = t.dist(A, B)) == 3, out);
    t.addEdge(0, 2, 4);
    t.addEdge(0, 3, 3);
    let C = t.node.get(3);
    Shrewd.commit();
    console.assert(t.node.size == 4 && t.leaf.size == 3);
    console.assert(a.degree == 3, '度數正確', a.degree);
    console.assert(t.edge.get(a, B).length == 4, '應該要更新為新的長度');
    console.assert(t.edge.size == 3);
    console.assert((out = t.dist(A, B)) == 6, 'AB 長度為 6', out);
    UnitTest.consoleHack = true;
    t.addEdge(1, 2, 5);
    t.addEdge(4, 5, 1);
    a.dispose();
    Shrewd.commit();
    console.assert(UnitTest.warnings.length == 3);
    console.assert(UnitTest.warnings[0] == 'Adding edge (1,2) will cause circuit.');
    console.assert(UnitTest.warnings[1] == 'Adding edge (4,5) disconnects the graph.');
    console.assert(UnitTest.warnings[2] == 'Node [0] is not a leaf.');
    let P = t.pair.get(A, C);
    let E = t.edge.get(C, a);
    console.assert(!P.disposed && !E.disposed && !C.disposed);
    C.dispose();
    Shrewd.commit();
    console.assert(C.disposed && P.disposed && E.disposed, '要正確解構', C.disposed, P.disposed, E.disposed);
    console.assert(t.node.size == 3 && t.leaf.size == 2, t);
    t.dispose();
}
//# sourceMappingURL=test.js.map
