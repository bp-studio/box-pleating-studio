/**
 * shrewd v0.0.13
 * (c) 2019-2021 Mu-Tsun Tsai
 * Released under the MIT License.
 */
;
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.Shrewd = factory();
    }
}(this, function () {
    var Shrewd = (() => {
        var __defProp = Object.defineProperty;
        var __markAsModule = target => __defProp(target, '__esModule', { value: true });
        var __export = (target, all) => {
            __markAsModule(target);
            for (var name in all)
                __defProp(target, name, {
                    get: all[name],
                    enumerable: true
                });
        };
        // src/Shrewd.ts
        var Shrewd_exports = {};
        __export(Shrewd_exports, {
            commit: () => commit,
            comparer: () => comparer,
            debug: () => debug,
            hook: () => hook,
            initialize: () => initialize,
            option: () => option,
            shrewd: () => shrewd,
            symbol: () => symbol,
            terminate: () => terminate
        });
        // src/interfaces/IShrewdPrototype.ts
        var $shrewdDecorators = Symbol('Shrewd Decorators');
        // src/adapters/Adapter.ts
        var Adapter = class {
            constructor(proto, prop, descriptor, options) {
                this._proto = proto;
                this._prop = prop;
                this._descriptor = descriptor;
                this._options = options;
            }
            get _name() {
                return this._proto.constructor.name + '.' + this._prop.toString();
            }
            get $decoratorDescriptor() {
                return {
                    $key: this._prop.toString(),
                    $class: this._proto.constructor.name,
                    $constructor: this._constructor,
                    $method: this._method,
                    $option: this._options
                };
            }
            get _method() {
                return void 0;
            }
            $setup() {
            }
        };
        // src/core/Comparer.ts
        var Comparer;
        (function (Comparer2) {
            function array(oldValue, newValue) {
                if (!oldValue != !newValue)
                    return false;
                if (oldValue == newValue)
                    return true;
                if (oldValue.length != newValue.length)
                    return false;
                for (let i = 0; i < oldValue.length; i++) {
                    if (oldValue[i] !== newValue[i])
                        return false;
                }
                return true;
            }
            Comparer2.array = array;
            function unorderedArray(oldValue, newValue) {
                if (!oldValue != !newValue)
                    return false;
                if (oldValue == newValue)
                    return true;
                if (oldValue.length != newValue.length)
                    return false;
                for (let v of oldValue)
                    if (!newValue.includes(v))
                        return false;
                return true;
            }
            Comparer2.unorderedArray = unorderedArray;
        }(Comparer || (Comparer = {})));
        // src/core/Decorators.ts
        var _Decorators = class {
            static get(proto) {
                if (HiddenProperty.$has(proto, $shrewdDecorators)) {
                    return proto[$shrewdDecorators];
                } else {
                    let decorators = [];
                    HiddenProperty.$add(proto, $shrewdDecorators, decorators);
                    return decorators;
                }
                ;
            }
            static $shrewd(a, b, c, d) {
                if (typeof b == 'undefined') {
                    if (typeof a == 'function') {
                        return _Decorators._shrewdClass(a);
                    } else {
                        return (proto, prop, descriptor) => _Decorators.$shrewd(proto, prop, descriptor, a);
                    }
                } else if (typeof b == 'string') {
                    let descriptor = c || Object.getOwnPropertyDescriptor(a, b);
                    if (!descriptor) {
                        return _Decorators._setup(ObservablePropertyAdapter, a, b, void 0, d);
                    } else if (descriptor.get && !descriptor.set) {
                        return _Decorators._setup(ComputedPropertyAdapter, a, b, descriptor, d);
                    } else if (typeof descriptor.value == 'function') {
                        return _Decorators._setup(ReactiveMethodAdapter, a, b, descriptor, d);
                    }
                }
                console.warn(`Setup error at ${ a.constructor.name }[${ b.toString() }]. Decorated member must be one of the following: a field, a readonly get accessor, or a method.`);
                if (Core.$option.debug)
                    debugger;
            }
            static _shrewdClass(ctor) {
                var proxy = new Proxy(ctor, _Decorators._shrewdProxyHandler);
                _Decorators._proxies.add(proxy);
                return proxy;
            }
            static _setup(ctor, proto, prop, descriptor, option2) {
                var adapter = new ctor(proto, prop, descriptor, option2);
                _Decorators.get(proto).push(adapter.$decoratorDescriptor);
                return adapter.$setup();
            }
        };
        var Decorators = _Decorators;
        Decorators._proxies = new WeakSet();
        Decorators._shrewdProxyHandler = {
            construct(target, args, newTarget) {
                if (!_Decorators._proxies.has(newTarget)) {
                    console.warn(`Class [${ newTarget.name }] is derived form @shrewd class [${ target.name }], but it is not decorated with @shrewd.`);
                }
                Global.$pushState({
                    $isConstructing: true,
                    $isCommitting: false,
                    $target: null
                });
                Observer.$trace.push(`construct ${ target.name }`);
                try {
                    let self = Reflect.construct(target, args, newTarget);
                    if (self.constructor == target)
                        new ShrewdObject(self);
                    if (_Decorators.$immediateInit.has(self)) {
                        _Decorators.$immediateInit.delete(self);
                        InitializationController.$initialize(self);
                    }
                    return self;
                } finally {
                    Observer.$trace.pop();
                    Global.$restore();
                }
            }
        };
        Decorators.$immediateInit = new Set();
        // src/core/Global.ts
        var _Global = class {
            static $pushState(state) {
                _Global._history.push(_Global._state);
                _Global._state = Object.assign({}, _Global._state, state);
            }
            static $restore() {
                _Global._state = _Global._history.pop();
                if (_Global._history.length == 0)
                    InitializationController.$flush();
            }
            static get $isCommitting() {
                return _Global._state.$isCommitting;
            }
            static get $isConstructing() {
                return _Global._state.$isConstructing;
            }
            static get $isRenderingProperty() {
                return _Global._state.$isRenderingProperty;
            }
            static get $target() {
                return _Global._state.$target;
            }
            static $isAccessible(observable) {
                return _Global._state.$accessibles.has(observable);
            }
            static $setAccessible(observable) {
                _Global._state.$accessibles.add(observable);
            }
        };
        var Global = _Global;
        Global._state = {
            $isCommitting: false,
            $isConstructing: false,
            $isRenderingProperty: false,
            $target: null,
            $accessibles: new Set()
        };
        Global._history = [];
        // src/core/ShrewdObject.ts
        var $shrewdObject = Symbol('ShrewdObject');
        var ShrewdObject = class {
            constructor(parent) {
                this._isTerminated = false;
                this._members = new Map();
                this._parent = HiddenProperty.$add(parent, $shrewdObject, this);
                let proto = Object.getPrototypeOf(this._parent);
                while (proto) {
                    if (HiddenProperty.$has(proto, $shrewdDecorators)) {
                        let decorators = proto[$shrewdDecorators];
                        for (let decorator of decorators) {
                            let member = new decorator.$constructor(this._parent, decorator);
                            if (!this._members.has(member.$internalKey)) {
                                this._members.set(member.$internalKey, member);
                            } else {
                                member.$terminate();
                            }
                        }
                    }
                    proto = Object.getPrototypeOf(proto);
                }
                for (let member of this._members.values()) {
                    InitializationController.$enqueue(member);
                }
            }
            $terminate() {
                if (this._isTerminated)
                    return;
                for (let member of this._members.values())
                    member.$terminate();
                delete this._parent;
                this._isTerminated = true;
            }
            $getMember(key) {
                if (!key)
                    return this._members.values();
                return this._members.get(key);
            }
            get $observables() {
                let result = [];
                for (let member of this._members.values()) {
                    if (member instanceof ObservableProperty) {
                        result.push(member);
                    }
                }
                return result;
            }
        };
        // src/class/Observable.ts
        var _Observable = class {
            constructor() {
                this._subscribers = new Set();
                this.$id = _Observable._id++;
            }
            static $isWritable(observable) {
                if (Global.$isConstructing || !observable.$hasSubscriber)
                    return true;
                if (Global.$isRenderingProperty && !Global.$isAccessible(observable)) {
                    console.warn('Inside a renderer function, only the objects owned by the ObservableProperty can be written.');
                    if (Core.$option.debug)
                        debugger;
                    return false;
                }
                if (!Global.$isRenderingProperty && Global.$isCommitting) {
                    console.warn('Writing into Observables is not allowed inside a ComputedProperty or a ReactiveMethod. For self-correcting behavior, use the renderer option of the ObservableProperty.');
                    if (Core.$option.debug)
                        debugger;
                    return false;
                }
                return true;
            }
            static $publish(observable) {
                Core.$option.hook.write(observable.$id);
                for (let observer of observable._subscribers) {
                    if (Core.$option.debug)
                        observer.$notified(observable);
                    else
                        observer.$notified();
                }
            }
            $addSubscriber(observer) {
                this._subscribers.add(observer);
            }
            $removeSubscriber(observer) {
                this._subscribers.delete(observer);
            }
            get $hasSubscriber() {
                return this._subscribers.size > 0;
            }
            get $subscribers() {
                return this._subscribers.values();
            }
        };
        var Observable2 = _Observable;
        Observable2._id = 0;
        // src/hook/DefaultHook.ts
        var DefaultHook = class {
            read(id) {
                return false;
            }
            write(id) {
            }
            gc() {
                return [];
            }
            sub(id) {
                return false;
            }
        };
        // src/hook/VueHook.ts
        var VueHook = class {
            constructor(vue) {
                this._queue = new Set();
                this._created = new Set();
                this._Vue = vue || typeof window != 'undefined' && window.Vue;
                if (!this._Vue)
                    throw new Error('Global Vue not found; you need to pass a Vue constructor to VueHook.');
                this._vue = new this._Vue({ data: { shrewd: {} } });
            }
            read(id) {
                let t = this._vue.shrewd[id];
                if (!Global.$isCommitting && !t) {
                    this._Vue.set(this._vue.shrewd, id, {});
                    t = this._vue.shrewd[id];
                }
                return t && t.__ob__.dep.subs.length > 0;
            }
            write(id) {
                if (Core.$option.autoCommit || Global.$isCommitting)
                    this._Vue.set(this._vue.shrewd, id, {});
                else
                    this._queue.add(id);
            }
            precommit() {
                for (let id of this._queue)
                    this._Vue.set(this._vue.shrewd, id, {});
                this._queue.clear();
            }
            gc() {
                let result = [];
                for (let id in this._vue.shrewd) {
                    let n = Number(id);
                    if (!Core.$option.autoCommit && !this._created.has(n)) {
                        this._created.add(n);
                    } else if (this._vue.shrewd[id].__ob__.dep.subs.length == 0) {
                        if (!Core.$option.autoCommit)
                            this._created.delete(n);
                        this._Vue.delete(this._vue.shrewd, id);
                        result.push(Number(id));
                    }
                }
                return result;
            }
            sub(id) {
                return id in this._vue.shrewd && this._vue.shrewd[id].__ob__.dep.subs.length > 0;
            }
        };
        // src/util/HiddenProperty.ts
        var HiddenProperty = class {
            static $has(target, prop) {
                return Object.prototype.hasOwnProperty.call(target, prop);
            }
            static $add(target, prop, value) {
                Object.defineProperty(target, prop, {
                    enumerable: false,
                    writable: false,
                    configurable: false,
                    value
                });
                return target;
            }
        };
        // src/helpers/CollectionProxyHandler.ts
        var CollectionProxyHandler = class {
            get(target, prop, receiver) {
                let ob = target[$observableHelper];
                let result = Reflect.get(target, prop);
                if (typeof result == 'function') {
                    result = this._method.bind({
                        $prop: prop,
                        $target: target,
                        $method: result.bind(target),
                        $helper: ob,
                        $receiver: receiver
                    });
                }
                if (prop == 'size')
                    Observer.$refer(target[$observableHelper]);
                return result;
            }
            _method(...args) {
                switch (this.$prop) {
                case 'clear':
                    if (Observer.$isWritable(this.$helper) && this.$target.size > 0) {
                        this.$target.clear();
                        Observable2.$publish(this.$helper);
                    }
                    return;
                case 'delete':
                    if (Observer.$isWritable(this.$helper) && this.$target.has(args[0])) {
                        this.$target.delete(args[0]);
                        Observable2.$publish(this.$helper);
                    }
                    return;
                case Symbol.iterator:
                case 'entries':
                case 'forEach':
                case 'has':
                case 'keys':
                case 'values':
                    Observer.$refer(this.$helper);
                default:
                    return this.$method(...args);
                }
            }
        };
        // src/controllers/AutoCommitController.ts
        var _AutoCommitController = class {
            static _autoCommit() {
                Core.$commit();
                _AutoCommitController._promised = false;
            }
            static $setup() {
                if (Core.$option.autoCommit && !_AutoCommitController._promised) {
                    _AutoCommitController._promised = true;
                    Promise.resolve().then(_AutoCommitController._autoCommit);
                }
            }
        };
        var AutoCommitController = _AutoCommitController;
        AutoCommitController._promised = false;
        // src/controllers/CommitController.ts
        var _CommitController = class {
            static $flush() {
                Global.$pushState({ $isCommitting: true });
                while (_CommitController._queue.size > 0) {
                    for (let ob of _CommitController._queue) {
                        ob.$backtrack();
                        if (ob.$isTerminated)
                            continue;
                        ob.$render();
                    }
                }
                Observer.$clearPending();
                Global.$restore();
            }
            static $dequeue(observer) {
                _CommitController._queue.delete(observer);
            }
            static $enqueue(observer) {
                if (!observer.$isRendering) {
                    _CommitController._queue.add(observer);
                }
                AutoCommitController.$setup();
            }
        };
        var CommitController = _CommitController;
        CommitController._queue = new Set();
        // src/controllers/DeadController.ts
        var _DeadController = class {
            static $enqueue(observable) {
                if (observable instanceof Observer)
                    _DeadController._queue.add(observable);
            }
            static $flush() {
                for (let ob of _DeadController._queue) {
                    Observer.$checkDeadEnd(ob);
                }
                _DeadController._queue.clear();
                for (let id of Core.$option.hook.gc()) {
                    let ob = Observer._map.get(id);
                    if (ob)
                        Observer.$checkDeadEnd(ob);
                }
                _DeadController._checked.clear();
            }
            static $tryMarkChecked(observer) {
                if (!_DeadController._checked.has(observer)) {
                    _DeadController._checked.add(observer);
                    return true;
                }
                return false;
            }
        };
        var DeadController = _DeadController;
        DeadController._queue = new Set();
        DeadController._checked = new Set();
        // src/controllers/InitializationController.ts
        var _InitializationController = class {
            static $enqueue(member) {
                _InitializationController._queue.add(member);
            }
            static $flush() {
                if (_InitializationController._running)
                    return;
                _InitializationController._running = true;
                for (let member of _InitializationController._queue) {
                    _InitializationController._queue.delete(member);
                    member.$initialize();
                }
                _InitializationController._running = false;
            }
            static $initialize(target) {
                if (!target[$shrewdObject]) {
                    Decorators.$immediateInit.add(target);
                    return;
                }
                if (_InitializationController._running)
                    return;
                _InitializationController._running = true;
                for (let member of target[$shrewdObject].$getMember()) {
                    _InitializationController._queue.delete(member);
                    member.$initialize();
                }
                _InitializationController._running = false;
            }
        };
        var InitializationController = _InitializationController;
        InitializationController._queue = new Set();
        InitializationController._running = false;
        // src/controllers/TerminationController.ts
        var _TerminationController = class {
            static $flush() {
                for (let shrewd2 of _TerminationController._queue) {
                    shrewd2.$terminate();
                }
                _TerminationController._queue.clear();
            }
            static $terminate(target, lazy = false) {
                if (target instanceof Object && HiddenProperty.$has(target, $shrewdObject)) {
                    let shrewd2 = target[$shrewdObject];
                    if (lazy) {
                        _TerminationController._queue.add(shrewd2);
                    } else {
                        shrewd2.$terminate();
                    }
                }
            }
        };
        var TerminationController = _TerminationController;
        TerminationController._queue = new Set();
        // src/core/Core.ts
        var _Core = class {
            static $commit() {
                if (_Core.$option.hook.precommit)
                    _Core.$option.hook.precommit();
                CommitController.$flush();
                TerminationController.$flush();
                if (_Core.$option.debug)
                    Observer.$clearTrigger();
                DeadController.$flush();
                if (_Core.$option.hook.postcommit)
                    _Core.$option.hook.postcommit();
            }
        };
        var Core = _Core;
        Core.$option = {
            hook: new DefaultHook(),
            autoCommit: true,
            debug: false
        };
        // src/adapters/ComputedPropertyAdapter.ts
        var ComputedPropertyAdapter = class extends Adapter {
            get _constructor() {
                return ComputedProperty;
            }
            get _method() {
                return this._descriptor.get;
            }
            $setup() {
                let name = this._name;
                let method = this._method;
                this._descriptor.get = function () {
                    if (HiddenProperty.$has(this, $shrewdObject)) {
                        let member = this[$shrewdObject].$getMember(name);
                        return member.$getter();
                    } else {
                        return method.apply(this);
                    }
                };
                return this._descriptor;
            }
        };
        // src/adapters/ObservablePropertyAdapter.ts
        var ObservablePropertyAdapter = class extends Adapter {
            get _constructor() {
                return ObservableProperty;
            }
        };
        // src/adapters/ReactivePropertyAdapter.ts
        var ReactiveMethodAdapter = class extends Adapter {
            get _constructor() {
                return ReactiveMethod;
            }
            get _method() {
                return this._descriptor.value;
            }
            $setup() {
                let name = this._name;
                let method = this._method;
                delete this._descriptor.value;
                delete this._descriptor.writable;
                this._descriptor.get = function () {
                    if (HiddenProperty.$has(this, $shrewdObject)) {
                        let member = this[$shrewdObject].$getMember(name);
                        return member.$getter();
                    } else {
                        return method.bind(this);
                    }
                };
                return this._descriptor;
            }
        };
        // src/class/Observer.ts
        var ObserverState;
        (function (ObserverState2) {
            ObserverState2[ObserverState2['$outdated'] = 0] = '$outdated';
            ObserverState2[ObserverState2['$updated'] = 1] = '$updated';
            ObserverState2[ObserverState2['$pending'] = 2] = '$pending';
        }(ObserverState || (ObserverState = {})));
        var _Observer = class extends Observable2 {
            constructor(name) {
                super();
                this._reference = [];
                this._rendering = false;
                this._state = 0;
                this._isTerminated = false;
                this._static = false;
                this._firstRender = true;
                this.trigger = new Set();
                _Observer._map.set(this.$id, this);
                this._name = name;
            }
            static $clearPending() {
                for (let pending of _Observer._pending) {
                    if (pending._state == 2 && pending.$isActive) {
                        pending._update();
                        _Observer._pending.delete(pending);
                    }
                }
            }
            static $clearTrigger() {
                for (let ob of _Observer._trigger)
                    ob.trigger.clear();
                _Observer._trigger.clear();
            }
            static $debug(ob) {
                let path = [ob._name];
                while (ob.trigger.size) {
                    let next = ob.trigger.values().next().value;
                    if (!(next instanceof _Observer))
                        break;
                    let msg = next._name;
                    if (next instanceof DecoratedMember3)
                        msg += '(' + DecoratedMember3.$getParent(next) + ')';
                    path.push(msg);
                    ob = next;
                }
                console.log(path);
            }
            static $refer(observable) {
                if (observable instanceof _Observer && observable._isTerminated)
                    return;
                if (Core.$option.hook.read(observable.$id) && observable instanceof _Observer)
                    observable._activate();
                let target = Global.$target;
                if (target && target != observable && !target._isTerminated && (!target._static || target._firstRender)) {
                    target._reference.push(observable);
                }
            }
            static $checkDeadEnd(observer) {
                if (DeadController.$tryMarkChecked(observer)) {
                    if (!observer._isTerminated && !(observer._isActive = observer.$checkActive())) {
                        for (let ref of observer._reference) {
                            if (ref instanceof _Observer)
                                _Observer.$checkDeadEnd(ref);
                        }
                    }
                }
            }
            get $isRendering() {
                return !!this._rendering;
            }
            $render() {
                Global.$pushState({
                    $isConstructing: false,
                    $target: this
                });
                this._rendering = true;
                CommitController.$dequeue(this);
                try {
                    let oldReferences;
                    if (!this._static) {
                        oldReferences = this._reference;
                        this._clearReference();
                    }
                    this.$prerendering();
                    try {
                        let result = this.$renderer();
                        this.$postrendering(result);
                    } finally {
                        this.$cleanup();
                    }
                    this._update();
                    if (!this._static) {
                        let newReferences = {};
                        if (!this._isTerminated) {
                            for (let observable of this._reference) {
                                newReferences[observable.$id] = true;
                                observable.$addSubscriber(this);
                                if (this.$isActive && observable instanceof _Observer) {
                                    observable._activate();
                                }
                            }
                        }
                        for (let observable of oldReferences) {
                            if (!(observable.$id in newReferences))
                                DeadController.$enqueue(observable);
                        }
                    } else if (this._firstRender) {
                        for (let observable of this._reference) {
                            observable.$addSubscriber(this);
                            if (this.$isActive && observable instanceof _Observer) {
                                observable._activate();
                            }
                        }
                        this._firstRender = false;
                    }
                } finally {
                    this._rendering = false;
                    Global.$restore();
                }
            }
            $notified(by) {
                this._pend();
                this._outdate(by);
                if (this.$isActive) {
                    CommitController.$enqueue(this);
                }
            }
            $terminate(cleanup = false) {
                if (this._isTerminated)
                    return;
                CommitController.$dequeue(this);
                _Observer._map.delete(this.$id);
                _Observer._pending.delete(this);
                this._onTerminate();
                this._isTerminated = true;
                this._clearReference();
                if (cleanup) {
                    for (let subscriber of this.$subscribers) {
                        let i = subscriber._reference.indexOf(this);
                        let last = subscriber._reference.pop();
                        if (last != this)
                            subscriber._reference[i] = last;
                        this.$removeSubscriber(subscriber);
                    }
                }
            }
            _onTerminate() {
                this._update();
                this._rendering = false;
            }
            _pend() {
                if (this._state == 1) {
                    this._state = 2;
                    _Observer._pending.add(this);
                    for (let subscriber of this.$subscribers) {
                        subscriber._pend();
                    }
                }
            }
            _determineStateAndRender() {
                if (this._rendering)
                    this._onCyclicDependencyFound();
                if (this._state == 1)
                    return;
                _Observer.$trace.push(this);
                try {
                    this.$backtrack();
                    if (this._state == 0) {
                        this.$render();
                    } else {
                        _Observer._pending.delete(this);
                        this._update();
                    }
                } finally {
                    _Observer.$trace.pop();
                }
            }
            $backtrack() {
                for (let ref of this._reference) {
                    if (ref instanceof _Observer) {
                        if (ref._rendering) {
                            this.$render();
                            break;
                        } else if (ref._state != 1) {
                            ref._determineStateAndRender();
                        }
                    }
                }
            }
            _onCyclicDependencyFound() {
                if (Core.$option.debug)
                    debugger;
                let last = _Observer.$trace.indexOf(this);
                let cycle = [
                    this,
                    ..._Observer.$trace.slice(last + 1)
                ];
                cycle.forEach(o => o instanceof _Observer && o.$terminate(true));
                cycle.push(this);
                let trace = cycle.map(o => typeof o == 'string' ? o : o._name).join(' => ');
                console.warn('Cyclic dependency detected: ' + trace + '\nAll these reactions will be terminated.');
            }
            _update() {
                this._state = 1;
            }
            _outdate(by) {
                if (by) {
                    _Observer._trigger.add(this);
                    this.trigger.add(by);
                }
                this._state = 0;
            }
            get $state() {
                return this._state;
            }
            get $isActive() {
                return this._isActive = this._isActive != void 0 ? this._isActive : this.$checkActive();
            }
            $checkActive() {
                if (Core.$option.hook.sub(this.$id))
                    return true;
                for (let subscriber of this.$subscribers) {
                    if (subscriber.$isActive)
                        return true;
                }
                return false;
            }
            _activate() {
                if (this.$isActive)
                    return;
                this._isActive = true;
                for (let observable of this._reference) {
                    if (observable instanceof _Observer)
                        observable._activate();
                }
            }
            $prerendering() {
            }
            $postrendering(result) {
            }
            $cleanup() {
            }
            _clearReference() {
                for (let observable of this._reference)
                    observable.$removeSubscriber(this);
                this._reference = [];
            }
            get $hasReferences() {
                return this._reference.length > 0;
            }
            get $isTerminated() {
                return this._isTerminated;
            }
        };
        var Observer = _Observer;
        Observer._pending = new Set();
        Observer._trigger = new Set();
        Observer._map = new Map();
        Observer.$trace = [];
        // src/helpers/Helper.ts
        var $observableHelper = Symbol('Observable Helper');
        var _Helper = class extends Observable2 {
            static $wrap(value) {
                if (!(value instanceof Object))
                    return value;
                if (_Helper._proxyMap.has(value))
                    return _Helper._proxyMap.get(value);
                if (!_Helper.$hasHelper(value)) {
                    switch (Object.getPrototypeOf(value)) {
                    case Array.prototype:
                        value = new ArrayHelper(value).$proxy;
                        break;
                    case Set.prototype:
                        value = new SetHelper(value).$proxy;
                        break;
                    case Map.prototype:
                        value = new MapHelper(value).$proxy;
                        break;
                    case Object.prototype:
                        value = new ObjectHelper(value).$proxy;
                        break;
                    }
                }
                return value;
            }
            static $clear(value) {
                if (_Helper.$hasHelper(value))
                    value = value[$observableHelper]._target;
                if (value instanceof Object && _Helper._proxyMap.has(value))
                    _Helper._proxyMap.delete(value);
            }
            static $hasHelper(value) {
                return value instanceof Object && HiddenProperty.$has(value, $observableHelper);
            }
            constructor(target, handler) {
                super();
                this._target = HiddenProperty.$add(target, $observableHelper, this);
                this._proxy = new Proxy(target, handler);
                _Helper._proxyMap.set(target, this._proxy);
            }
            get $proxy() {
                return this._proxy;
            }
        };
        var Helper2 = _Helper;
        Helper2._proxyMap = new WeakMap();
        // src/components/DecoratedMember.ts
        var DecoratedMember3 = class extends Observer {
            static $getParent(dm) {
                return dm._parent.constructor.name;
            }
            constructor(parent, descriptor) {
                super(descriptor.$class + '.' + descriptor.$key.toString());
                var _a, _b;
                this._descriptor = descriptor;
                this._option = Object.assign(this._defaultOption, descriptor.$option);
                this._static = (_b = (_a = descriptor.$option) == null ? void 0 : _a.static) != null ? _b : false;
                this._parent = parent;
            }
            get $internalKey() {
                return this._descriptor.$class + '.' + this._descriptor.$key.toString();
            }
            $initialize() {
                this._determineStateAndRender();
            }
            get _defaultOption() {
                return {};
            }
            $checkActive() {
                if (this._option.active)
                    return true;
                return super.$checkActive();
            }
            $getter() {
                if (this.$isTerminated) {
                    return this.$terminateGet();
                } else {
                    Observer.$refer(this);
                    return this.$regularGet();
                }
            }
        };
        // src/helpers/ObjectHelper.ts
        var ObjectProxyHandler = class {
            has(target, prop) {
                Observer.$refer(target[$observableHelper]);
                return Reflect.has(target, prop);
            }
            get(target, prop, receiver) {
                Observer.$refer(target[$observableHelper]);
                let result = Reflect.get(target, prop, receiver);
                return result;
            }
            set(target, prop, value, receiver) {
                let ob = target[$observableHelper];
                if (Observable2.$isWritable(ob)) {
                    let old = Reflect.get(target, prop, receiver);
                    if (value !== old) {
                        Reflect.set(target, prop, Helper2.$wrap(value), receiver);
                        Observable2.$publish(ob);
                    }
                    return true;
                } else
                    return true;
            }
            deleteProperty(target, prop) {
                let ob = target[$observableHelper];
                if (Observable2.$isWritable(ob)) {
                    let result = Reflect.deleteProperty(target, prop);
                    if (result)
                        Observable2.$publish(ob);
                    return result;
                } else
                    return true;
            }
        };
        var _ObjectHelper = class extends Helper2 {
            constructor(target) {
                for (let key in target)
                    target[key] = Helper2.$wrap(target[key]);
                super(target, _ObjectHelper._handler);
            }
            get $children() {
                let result = [];
                for (let key in this._target) {
                    let value = this._target[key];
                    if (typeof value == 'object') {
                        result.push(value);
                    }
                }
                return result;
            }
        };
        var ObjectHelper = _ObjectHelper;
        ObjectHelper._handler = new ObjectProxyHandler();
        // src/helpers/MapHelper.ts
        var MapProxyHandler = class extends CollectionProxyHandler {
            _method(...args) {
                if (this.$prop == 'set') {
                    if (Observer.$isWritable(this.$helper) && !this.$target.has(args[0])) {
                        this.$target.set(args[0], Helper2.$wrap(args[1]));
                        Observable2.$publish(this.$helper);
                    }
                    return this.$receiver;
                }
                return super._method.apply(this, args);
            }
        };
        var _MapHelper = class extends Helper2 {
            constructor(map) {
                for (let [key, value] of map)
                    map.set(key, Helper2.$wrap(value));
                super(map, _MapHelper._handler);
            }
            get $children() {
                let result = [];
                for (let [key, value] of this._target) {
                    if (typeof key == 'object') {
                        result.push(key);
                    }
                    if (typeof value == 'object') {
                        result.push(value);
                    }
                }
                return result;
            }
        };
        var MapHelper = _MapHelper;
        MapHelper._handler = new MapProxyHandler();
        // src/helpers/SetHelper.ts
        var SetProxyHandler = class extends CollectionProxyHandler {
            _method(...args) {
                if (this.$prop == 'add') {
                    if (Observer.$isWritable(this.$helper) && !this.$target.has(args[0])) {
                        this.$target.add(Helper2.$wrap(args[0]));
                        Observable2.$publish(this.$helper);
                    }
                    return this.$receiver;
                }
                return super._method.apply(this, args);
            }
        };
        var _SetHelper = class extends Helper2 {
            constructor(set) {
                for (let value of set) {
                    set.delete(value);
                    set.add(Helper2.$wrap(value));
                }
                super(set, _SetHelper._handler);
            }
            get $children() {
                let result = [];
                for (let value of this._target) {
                    if (typeof value == 'object') {
                        result.push(value);
                    }
                }
                return result;
            }
        };
        var SetHelper = _SetHelper;
        SetHelper._handler = new SetProxyHandler();
        // src/components/ComputedProperty.ts
        var ComputedProperty = class extends DecoratedMember3 {
            constructor(parent, descriptor) {
                super(parent, descriptor);
                var _a, _b;
                this._getter = descriptor.$method;
                if (this._option.active)
                    this.$notified();
                (_b = (_a = this._option).comparer) != null ? _b : _a.comparer = (ov, nv) => ov === nv;
            }
            get $renderer() {
                return this._getter.bind(this._parent);
            }
            $postrendering(result) {
                if (!this._option.comparer.apply(this._parent, [
                        this._value,
                        result,
                        this
                    ])) {
                    this._value = result;
                    Observable2.$publish(this);
                }
                if (!this.$hasReferences)
                    this.$terminate();
            }
            $regularGet() {
                this._determineStateAndRender();
                if (!this.$hasReferences)
                    this.$terminate();
                return this._value;
            }
            $terminateGet() {
                return this._value;
            }
            _onTerminate() {
                Helper2.$clear(this._value);
                super._onTerminate();
            }
        };
        // src/components/ObservableProperty.ts
        var _ObservableProperty = class extends DecoratedMember3 {
            constructor(parent, descriptor) {
                super(parent, descriptor);
                this._initialized = false;
                this._outputValue = this._inputValue = Reflect.get(parent, descriptor.$key);
                Object.defineProperty(parent, descriptor.$key, _ObservableProperty.$interceptor(descriptor.$key));
                if (!this._option.renderer) {
                    this._update();
                }
            }
            static $interceptor(key) {
                return _ObservableProperty._interceptor[key] = _ObservableProperty._interceptor[key] || {
                    get() {
                        let member = this[$shrewdObject].$getMember(key);
                        return member.$getter();
                    },
                    set(value) {
                        let member = this[$shrewdObject].$getMember(key);
                        member.$setter(value);
                    }
                };
            }
            static $setAccessible(target) {
                if (!(target instanceof Object))
                    return;
                if (Helper2.$hasHelper(target)) {
                    if (!Global.$isAccessible(target[$observableHelper])) {
                        Global.$setAccessible(target[$observableHelper]);
                        for (let child of target[$observableHelper].$children)
                            _ObservableProperty.$setAccessible(child);
                    }
                } else if (HiddenProperty.$has(target, $shrewdObject)) {
                    for (let obp of target[$shrewdObject].$observables) {
                        if (!Global.$isAccessible(obp)) {
                            Global.$setAccessible(obp);
                            _ObservableProperty.$setAccessible(obp._outputValue);
                        }
                    }
                }
            }
            get $internalKey() {
                return this._descriptor.$key.toString();
            }
            $initialize() {
                if (this._initialized)
                    return;
                this._initialValidation();
                if (this._option.renderer) {
                    this._determineStateAndRender();
                } else {
                    this._outputValue = this._inputValue;
                }
                this._initialized = true;
            }
            _outdate(by) {
                if (this._option.renderer) {
                    super._outdate(by);
                }
            }
            _initialValidation() {
                var _a, _b;
                if (!((_b = (_a = this._option.validator) == null ? void 0 : _a.apply(this._parent, [this._inputValue])) != null ? _b : true)) {
                    this._inputValue = void 0;
                }
                this._inputValue = Helper2.$wrap(this._inputValue);
            }
            $regularGet() {
                if (!this._initialized) {
                    this._initialValidation();
                    return this._inputValue;
                } else if (this._option.renderer) {
                    this._determineStateAndRender();
                }
                return this._outputValue;
            }
            $terminateGet() {
                return this._outputValue;
            }
            $setter(value) {
                var _a, _b;
                if (this.$isTerminated) {
                    this._outputValue = value;
                    return;
                }
                if (Observable2.$isWritable(this) && value !== this._inputValue) {
                    if (!((_b = (_a = this._option.validator) == null ? void 0 : _a.apply(this._parent, [value])) != null ? _b : true)) {
                        return Core.$option.hook.write(this.$id);
                    }
                    this._inputValue = Helper2.$wrap(value);
                    if (this._option.renderer) {
                        this.$prerendering();
                        try {
                            this.$postrendering(this.$renderer());
                        } finally {
                            this.$cleanup();
                        }
                    } else {
                        this.$publish(this._inputValue);
                    }
                }
            }
            $prerendering() {
                Global.$pushState({
                    $isRenderingProperty: true,
                    $accessibles: new Set()
                });
                _ObservableProperty.$setAccessible(this._inputValue);
            }
            get $renderer() {
                return this._option.renderer.bind(this._parent, this._inputValue);
            }
            $postrendering(result) {
                if (result !== this._outputValue) {
                    this.$publish(Helper2.$wrap(result));
                }
            }
            $cleanup() {
                Global.$restore();
            }
            $publish(value) {
                this._outputValue = value;
                Observable2.$publish(this);
            }
            _onTerminate() {
                Helper2.$clear(this._inputValue);
                Helper2.$clear(this._outputValue);
                delete this._inputValue;
                delete this._option;
                super._onTerminate();
            }
        };
        var ObservableProperty = _ObservableProperty;
        ObservableProperty._interceptor = {};
        // src/components/ReactiveMethod.ts
        var ReactiveMethod = class extends DecoratedMember3 {
            constructor(parent, descriptor) {
                super(parent, descriptor);
                this._method = descriptor.$method;
            }
            get _defaultOption() {
                return { active: true };
            }
            get $renderer() {
                return this._method.bind(this._parent);
            }
            $regularGet() {
                return () => {
                    this._determineStateAndRender();
                    return this._result;
                };
            }
            $terminateGet() {
                return () => this._result;
            }
            $postrendering(result) {
                this._result = result;
                Observable2.$publish(this);
            }
            _onTerminate() {
                Helper2.$clear(this._result);
                super._onTerminate();
            }
        };
        // src/helpers/ArrayHelper.ts
        var ArrayProxyHandler = class extends ObjectProxyHandler {
            get(target, prop, receiver) {
                if (prop == 'length' || typeof prop == 'symbol' || typeof prop == 'number' || typeof prop == 'string' && prop.match(/^\d+$/)) {
                    Observer.$refer(target[$observableHelper]);
                }
                return Reflect.get(target, prop, receiver);
            }
        };
        var _ArrayHelper = class extends Helper2 {
            constructor(arr) {
                for (let i in arr) {
                    arr[i] = Helper2.$wrap(arr[i]);
                }
                super(arr, _ArrayHelper._handler);
            }
            get $children() {
                let result = [];
                for (let value of this._target) {
                    if (typeof value == 'object') {
                        result.push(value);
                    }
                }
                return this._target;
            }
        };
        var ArrayHelper = _ArrayHelper;
        ArrayHelper._handler = new ArrayProxyHandler();
        // src/Shrewd.ts
        if (typeof window !== 'undefined' && window.Vue) {
            Core.$option.hook = new VueHook();
        }
        var shrewd = Decorators.$shrewd;
        var symbol = $shrewdObject;
        var commit = Core.$commit;
        var terminate = TerminationController.$terminate;
        var initialize = InitializationController.$initialize;
        var hook = {
            default: DefaultHook,
            vue: VueHook
        };
        var option = Core.$option;
        var comparer = Comparer;
        var debug = {
            trigger(target, key) {
                if (target instanceof Object) {
                    if (HiddenProperty.$has(target, $shrewdObject)) {
                        let member = target[$shrewdObject].$getMember(key);
                        if (!member)
                            console.log('Member not found');
                        else
                            Observer.$debug(member);
                    } else if (target instanceof Observer) {
                        Observer.$debug(target);
                    }
                }
            }
        };
        return Shrewd_exports;
    })();
    return Shrewd;
}));

//# sourceMappingURL=shrewd.js.map
