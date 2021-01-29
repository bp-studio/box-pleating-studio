/**
 * shrewd v0.0.11
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
    'use strict';
    var Comparer;
    (function (Comparer) {
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
        Comparer.array = array;
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
        Comparer.unorderedArray = unorderedArray;
    }(Comparer || (Comparer = {})));
    class Observable {
        constructor() {
            this._subscribers = new Set();
            this.$id = Observable._id++;
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
        $subscribe(observer) {
            this._subscribers.add(observer);
        }
        $unsubscribe(observer) {
            this._subscribers.delete(observer);
        }
        get $hasSubscriber() {
            return this._subscribers.size > 0;
        }
        get $subscribers() {
            return this._subscribers.values();
        }
    }
    Observable._id = 0;
    class DefaultHook {
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
    }
    class VueHook {
        constructor(vue) {
            this._writes = new Set();
            this._Vue = vue || typeof window != 'undefined' && window.Vue;
            if (!this._Vue)
                throw new Error('Global Vue not found; you need to pass a Vue constructor to VueHook.');
            this._vue = new this._Vue({ data: { shrewd: {} } });
        }
        read(id) {
            let t = this._vue.shrewd[id];
            return t && t.__ob__.dep.subs.length > 0;
        }
        write(id) {
            if (Core.$option.autoCommit)
                this._Vue.set(this._vue.shrewd, id, {});
            else
                this._writes.add(id);
        }
        precommit() {
            for (let id of this._writes)
                this._Vue.set(this._vue.shrewd, id, {});
            this._writes.clear();
        }
        gc() {
            let result = [];
            for (let id in this._vue.shrewd) {
                if (this._vue.shrewd[id].__ob__.dep.subs.length == 0) {
                    this._Vue.delete(this._vue.shrewd, id);
                    result.push(Number(id));
                }
            }
            return result;
        }
        sub(id) {
            return id in this._vue.shrewd && this._vue.shrewd[id].__ob__.dep.subs.length > 0;
        }
    }
    class Core {
        static $commit() {
            if (Core.$option.hook.precommit)
                Core.$option.hook.precommit();
            Global.$pushState({ $isCommitting: true });
            try {
                for (let observer of Core._renderQueue) {
                    Observer.$render(observer, true);
                }
            } finally {
                Observer.$clearPending();
                Core._renderQueue.clear();
                Global.$restore();
                for (let shrewd of Core._terminateQueue) {
                    shrewd.$terminate();
                }
                Core._terminateQueue.clear();
                for (let id of Core.$option.hook.gc()) {
                    let ob = Observer._map.get(id);
                    if (ob)
                        Observer.$checkDeadEnd(ob);
                }
            }
            if (Core.$option.hook.postcommit)
                Core.$option.hook.postcommit();
        }
        static $queueInitialization(member) {
            Core._initializeQueue.add(member);
        }
        static $initializeAll() {
            if (Core._initializing)
                return;
            Core._initializing = true;
            for (let member of Core._initializeQueue) {
                Core._initializeQueue.delete(member);
                member.$initialize();
            }
            Core._initializing = false;
        }
        static $initialize(target) {
            if (!target[$shrewdObject]) {
                Decorators.$immediateInit.add(target);
                return;
            }
            if (Core._initializing)
                return;
            Core._initializing = true;
            for (let member of target[$shrewdObject].$getMember()) {
                Core._initializeQueue.delete(member);
                member.$initialize();
            }
            Core._initializing = false;
        }
        static _autoCommit() {
            Core.$commit();
            Core._promised = false;
        }
        static $dequeue(observer) {
            Core._renderQueue.delete(observer);
        }
        static $enqueue(observer) {
            if (!observer.$isRendering) {
                Core._renderQueue.add(observer);
            }
            if (Core.$option.autoCommit && !Core._promised) {
                Promise.resolve().then(Core._autoCommit);
                Core._promised = true;
            }
        }
        static $terminate(target, lazy = false) {
            if (HiddenProperty.$has(target, $shrewdObject)) {
                let shrewd = target[$shrewdObject];
                if (lazy) {
                    Core._terminateQueue.add(shrewd);
                } else {
                    shrewd.$terminate();
                }
            }
        }
    }
    Core.$option = {
        hook: new DefaultHook(),
        autoCommit: true,
        debug: false
    };
    Core._renderQueue = new Set();
    Core._terminateQueue = new Set();
    Core._initializeQueue = new Set();
    Core._promised = false;
    Core._initializing = false;
    class Decorators {
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
                    return Decorators._shrewdClass(a);
                } else {
                    return (proto, prop, descriptor) => Decorators.$shrewd(proto, prop, descriptor, a);
                }
            } else if (typeof b == 'string') {
                let descriptor = c || Object.getOwnPropertyDescriptor(a, b);
                if (!descriptor) {
                    return Decorators._setup(ObservablePropertyAdapter, a, b, undefined, d);
                } else if (descriptor.get && !descriptor.set) {
                    return Decorators._setup(ComputedPropertyAdapter, a, b, descriptor, d);
                } else if (typeof descriptor.value == 'function') {
                    return Decorators._setup(ReactiveMethodAdapter, a, b, descriptor, d);
                }
            }
            console.warn(`Setup error at ${ a.constructor.name }[${ b.toString() }]. ` + 'Decorated member must be one of the following: a field, a readonly get accessor, or a method.');
            if (Core.$option.debug)
                debugger;
        }
        static _shrewdClass(ctor) {
            var proxy = new Proxy(ctor, Decorators._shrewdProxyHandler);
            Decorators._proxies.add(proxy);
            return proxy;
        }
        static _setup(ctor, proto, prop, descriptor, option) {
            var adapter = new ctor(proto, prop, descriptor, option);
            Decorators.get(proto).push(adapter.$decoratorDescriptor);
            return adapter.$setup();
        }
    }
    Decorators._proxies = new WeakSet();
    Decorators._shrewdProxyHandler = {
        construct(target, args, newTarget) {
            if (!Decorators._proxies.has(newTarget)) {
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
                if (Decorators.$immediateInit.has(self)) {
                    Decorators.$immediateInit.delete(self);
                    Core.$initialize(self);
                }
                return self;
            } finally {
                Observer.$trace.pop();
                Global.$restore();
            }
        }
    };
    Decorators.$immediateInit = new Set();
    const $shrewdObject = Symbol('ShrewdObject');
    class ShrewdObject {
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
                Core.$queueInitialization(member);
            }
        }
        $terminate() {
            if (this._isTerminated)
                return;
            for (let member of this._members.values())
                member.$terminate();
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
    }
    class HiddenProperty {
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
    }
    class CollectionProxyHandler {
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
                    Observable.$publish(this.$helper);
                }
                return;
            case 'delete':
                if (Observer.$isWritable(this.$helper) && this.$target.has(args[0])) {
                    this.$target.delete(args[0]);
                    Observable.$publish(this.$helper);
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
    }
    var ObserverState;
    (function (ObserverState) {
        ObserverState[ObserverState['$outdated'] = 0] = '$outdated';
        ObserverState[ObserverState['$updated'] = 1] = '$updated';
        ObserverState[ObserverState['$pending'] = 2] = '$pending';
    }(ObserverState || (ObserverState = {})));
    class Observer extends Observable {
        constructor(name) {
            super();
            this._reference = new Set();
            this._isRendering = false;
            this._state = ObserverState.$outdated;
            this._isTerminated = false;
            this.trigger = new Set();
            Observer._map.set(this.$id, this);
            this._name = name;
        }
        static $clearPending() {
            for (let pending of Observer._pending) {
                if (pending._state == ObserverState.$pending && pending.$isActive) {
                    pending._update();
                    Observer._pending.delete(pending);
                }
            }
        }
        static $refer(observable) {
            if (observable instanceof Observer && observable._isTerminated)
                return;
            if (Core.$option.hook.read(observable.$id) && observable instanceof Observer)
                observable._activate();
            let target = Global.$target;
            if (target && target != observable && !target._isTerminated) {
                target._reference.add(observable);
            }
        }
        static $checkDeadEnd(observable) {
            if (observable instanceof Observer && !observable._isTerminated && observable._isActive && !(observable._isActive = observable.$checkActive())) {
                Core.$dequeue(observable);
                for (let ref of observable._reference) {
                    Observer.$checkDeadEnd(ref);
                }
            }
        }
        static $render(observer, backtrack = false) {
            if (backtrack) {
                observer._backtrack();
                if (observer._isTerminated)
                    return;
            }
            Global.$pushState({
                $isConstructing: false,
                $target: observer
            });
            observer._isRendering = true;
            Core.$dequeue(observer);
            try {
                let oldReferences = new Set(observer._reference);
                observer._clearReference();
                observer.$prerendering();
                try {
                    let result = observer.$renderer();
                    observer.$postrendering(result);
                } finally {
                    observer.$cleanup();
                }
                observer._update();
                if (Core.$option.debug)
                    observer.trigger.clear();
                if (!observer._isTerminated) {
                    for (let observable of observer._reference) {
                        oldReferences.delete(observable);
                        observable.$subscribe(observer);
                        if (observer.$isActive && observable instanceof Observer) {
                            observable._activate();
                        }
                    }
                }
                for (let observable of oldReferences) {
                    Observer.$checkDeadEnd(observable);
                }
            } finally {
                observer._isRendering = false;
                Global.$restore();
            }
        }
        get $isRendering() {
            return this._isRendering;
        }
        $notified(by) {
            this._pend();
            this._outdate(by);
            if (this.$isActive) {
                Core.$enqueue(this);
            }
        }
        $terminate() {
            if (this._isTerminated)
                return;
            Core.$dequeue(this);
            Observer._map.delete(this.$id);
            Observer._pending.delete(this);
            this._isTerminated = true;
            this._onTerminate();
        }
        _onTerminate() {
            this._clearReference();
            for (let subscriber of this.$subscribers) {
                subscriber._reference.delete(this);
                this.$unsubscribe(subscriber);
            }
            this._update();
            this._isRendering = false;
        }
        _pend() {
            if (this._state == ObserverState.$updated) {
                this._state = ObserverState.$pending;
                Observer._pending.add(this);
                for (let subscriber of this.$subscribers) {
                    subscriber._pend();
                }
            }
        }
        _determineStateAndRender() {
            if (this._isRendering)
                this._onCyclicDependencyFound();
            if (this._state == ObserverState.$updated)
                return;
            Observer.$trace.push(this);
            try {
                this._backtrack();
                if (this._state == ObserverState.$outdated) {
                    Observer.$render(this);
                } else {
                    Observer._pending.delete(this);
                    this._update();
                }
            } finally {
                Observer.$trace.pop();
            }
        }
        _backtrack() {
            for (let ref of this._reference) {
                if (ref instanceof Observer) {
                    if (ref._isRendering) {
                        Observer.$render(this);
                        break;
                    } else if (ref._state != ObserverState.$updated) {
                        ref._determineStateAndRender();
                    }
                }
            }
        }
        _onCyclicDependencyFound() {
            if (Core.$option.debug)
                debugger;
            let last = Observer.$trace.indexOf(this);
            let cycle = [
                this,
                ...Observer.$trace.slice(last + 1)
            ];
            cycle.forEach(o => o instanceof Observer && o.$terminate());
            cycle.push(this);
            let trace = cycle.map(o => typeof o == 'string' ? o : o._name).join(' => ');
            console.warn('Cyclic dependency detected: ' + trace + '\nAll these reactions will be terminated.');
        }
        _update() {
            this._state = ObserverState.$updated;
        }
        _outdate(by) {
            if (by)
                this.trigger.add(by);
            this._state = ObserverState.$outdated;
        }
        get $state() {
            return this._state;
        }
        get $isActive() {
            return this._isActive = this._isActive != undefined ? this._isActive : this.$checkActive();
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
                if (observable instanceof Observer)
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
                observable.$unsubscribe(this);
            this._reference.clear();
        }
        get $hasReferences() {
            return this._reference.size > 0;
        }
        get $isTerminated() {
            return this._isTerminated;
        }
    }
    Observer._pending = new Set();
    Observer._map = new Map();
    Observer.$trace = [];
    const $observableHelper = Symbol('Observable Helper');
    class Helper extends Observable {
        constructor(target, handler) {
            super();
            this._target = HiddenProperty.$add(target, $observableHelper, this);
            this._proxy = new Proxy(target, handler);
            Helper._proxyMap.set(target, this._proxy);
        }
        static $wrap(value) {
            if (value == null || typeof value != 'object')
                return value;
            if (Helper._proxyMap.has(value))
                return Helper._proxyMap.get(value);
            if (!Helper.$hasHelper(value)) {
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
            if (Helper.$hasHelper(value))
                value = value[$observableHelper]._target;
            if (Helper._proxyMap.has(value))
                Helper._proxyMap.delete(value);
        }
        static $hasHelper(value) {
            return value != null && typeof value == 'object' && HiddenProperty.$has(value, $observableHelper);
        }
        get $proxy() {
            return this._proxy;
        }
    }
    Helper._proxyMap = new WeakMap();
    class DecoratedMember extends Observer {
        constructor(parent, descriptor) {
            super(descriptor.$class + '.' + descriptor.$key.toString());
            this._descriptor = descriptor;
            this._option = Object.assign(this._defaultOption, descriptor.$option);
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
    }
    class ObjectProxyHandler {
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
            if (Observable.$isWritable(ob)) {
                let old = Reflect.get(target, prop, receiver);
                if (value !== old) {
                    Reflect.set(target, prop, Helper.$wrap(value), receiver);
                    Observable.$publish(ob);
                }
                return true;
            } else
                return true;
        }
        deleteProperty(target, prop) {
            let ob = target[$observableHelper];
            if (Observable.$isWritable(ob)) {
                let result = Reflect.deleteProperty(target, prop);
                if (result)
                    Observable.$publish(ob);
                return result;
            } else
                return true;
        }
    }
    class ObjectHelper extends Helper {
        constructor(target) {
            for (let key in target)
                target[key] = Helper.$wrap(target[key]);
            super(target, ObjectHelper._handler);
        }
        get $child() {
            let result = [];
            for (let key in this._target) {
                let value = this._target[key];
                if (typeof value == 'object') {
                    result.push(value);
                }
            }
            return result;
        }
    }
    ObjectHelper._handler = new ObjectProxyHandler();
    class SetProxyHandler extends CollectionProxyHandler {
        _method(...args) {
            if (this.$prop == 'add') {
                if (Observer.$isWritable(this.$helper) && !this.$target.has(args[0])) {
                    this.$target.add(Helper.$wrap(args[0]));
                    Observable.$publish(this.$helper);
                }
                return this.$receiver;
            }
            return super._method.apply(this, args);
        }
    }
    class SetHelper extends Helper {
        constructor(set) {
            for (let value of set) {
                set.delete(value);
                set.add(Helper.$wrap(value));
            }
            super(set, SetHelper._handler);
        }
        get $child() {
            let result = [];
            for (let value of this._target) {
                if (typeof value == 'object') {
                    result.push(value);
                }
            }
            return result;
        }
    }
    SetHelper._handler = new SetProxyHandler();
    class MapProxyHandler extends CollectionProxyHandler {
        _method(...args) {
            if (this.$prop == 'set') {
                if (Observer.$isWritable(this.$helper) && !this.$target.has(args[0])) {
                    this.$target.set(args[0], Helper.$wrap(args[1]));
                    Observable.$publish(this.$helper);
                }
                return this.$receiver;
            }
            return super._method.apply(this, args);
        }
    }
    class MapHelper extends Helper {
        constructor(map) {
            for (let [key, value] of map)
                map.set(key, Helper.$wrap(value));
            super(map, MapHelper._handler);
        }
        get $child() {
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
    }
    MapHelper._handler = new MapProxyHandler();
    class ComputedProperty extends DecoratedMember {
        constructor(parent, descriptor) {
            var _a;
            var _b;
            super(parent, descriptor);
            this._getter = descriptor.$method;
            if (this._option.active)
                this.$notified();
            (_a = (_b = this._option).comparer) !== null && _a !== void 0 ? _a : _b.comparer = (ov, nv) => ov === nv;
        }
        get $renderer() {
            return this._getter.bind(this._parent);
        }
        $postrendering(result) {
            if (!this._option.comparer(this._value, result)) {
                this._value = result;
                Observable.$publish(this);
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
            Helper.$clear(this._value);
            super._onTerminate();
        }
    }
    class ObservableProperty extends DecoratedMember {
        constructor(parent, descriptor) {
            super(parent, descriptor);
            this._initialized = false;
            this._outputValue = this._inputValue = parent[descriptor.$key];
            Object.defineProperty(parent, descriptor.$key, ObservableProperty.$interceptor(descriptor.$key));
            if (!this._option.renderer) {
                this._update();
            }
        }
        static $interceptor(key) {
            return ObservableProperty._interceptor[key] = ObservableProperty._interceptor[key] || {
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
            if (target == null || typeof target != 'object')
                return;
            if (Helper.$hasHelper(target)) {
                if (!Global.$isAccessible(target[$observableHelper])) {
                    Global.$setAccessible(target[$observableHelper]);
                    for (let child of target[$observableHelper].$child)
                        ObservableProperty.$setAccessible(child);
                }
            } else if (HiddenProperty.$has(target, $shrewdObject)) {
                for (let obp of target[$shrewdObject].$observables) {
                    if (!Global.$isAccessible(obp)) {
                        Global.$setAccessible(obp);
                        ObservableProperty.$setAccessible(obp._outputValue);
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
            if (!((_b = (_a = this._option.validator) === null || _a === void 0 ? void 0 : _a.apply(this._parent, [this._inputValue])) !== null && _b !== void 0 ? _b : true)) {
                this._inputValue = undefined;
            }
            this._inputValue = Helper.$wrap(this._inputValue);
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
            if (Observable.$isWritable(this) && value !== this._inputValue) {
                if (!((_b = (_a = this._option.validator) === null || _a === void 0 ? void 0 : _a.apply(this._parent, [value])) !== null && _b !== void 0 ? _b : true)) {
                    return Core.$option.hook.write(this.$id);
                }
                this._inputValue = Helper.$wrap(value);
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
            ObservableProperty.$setAccessible(this._inputValue);
        }
        get $renderer() {
            return this._option.renderer.bind(this._parent, this._inputValue);
        }
        $postrendering(result) {
            if (result !== this._outputValue) {
                this.$publish(Helper.$wrap(result));
            }
        }
        $cleanup() {
            Global.$restore();
        }
        $publish(value) {
            this._outputValue = value;
            Observable.$publish(this);
        }
        _onTerminate() {
            Helper.$clear(this._inputValue);
            Helper.$clear(this._outputValue);
            delete this._inputValue;
            delete this._option;
            super._onTerminate();
        }
    }
    ObservableProperty._interceptor = {};
    class ReactiveMethod extends DecoratedMember {
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
            Observable.$publish(this);
        }
        _onTerminate() {
            Helper.$clear(this._result);
            super._onTerminate();
        }
    }
    class ArrayProxyHandler extends ObjectProxyHandler {
        get(target, prop, receiver) {
            if (prop == 'length' || typeof prop == 'symbol' || typeof prop == 'number' || typeof prop == 'string' && prop.match(/^\d+$/)) {
                Observer.$refer(target[$observableHelper]);
            }
            return Reflect.get(target, prop, receiver);
        }
    }
    class ArrayHelper extends Helper {
        constructor(arr) {
            for (let i in arr) {
                arr[i] = Helper.$wrap(arr[i]);
            }
            super(arr, ArrayHelper._handler);
        }
        get $child() {
            let result = [];
            for (let value of this._target) {
                if (typeof value == 'object') {
                    result.push(value);
                }
            }
            return this._target;
        }
    }
    ArrayHelper._handler = new ArrayProxyHandler();
    var Shrewd;
    (function (Shrewd) {
        Shrewd.shrewd = Decorators.$shrewd;
        Shrewd.symbol = $shrewdObject;
        Shrewd.commit = Core.$commit;
        Shrewd.terminate = Core.$terminate;
        Shrewd.initialize = Core.$initialize;
        Shrewd.hook = {
            default: DefaultHook,
            vue: VueHook
        };
        Shrewd.option = Core.$option;
        Shrewd.comparer = Comparer;
    }(Shrewd || (Shrewd = {})));
    if (typeof window !== 'undefined' && window.Vue) {
        Core.$option.hook = new VueHook();
    }
    class Adapter {
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
            return undefined;
        }
        $setup() {
        }
    }
    class ComputedPropertyAdapter extends Adapter {
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
    }
    class ObservablePropertyAdapter extends Adapter {
        get _constructor() {
            return ObservableProperty;
        }
    }
    class ReactiveMethodAdapter extends Adapter {
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
    }
    class Global {
        static $pushState(state) {
            Global._history.push(Global._state);
            Global._state = Object.assign({}, Global._state, state);
        }
        static $restore() {
            Global._state = Global._history.pop();
            if (Global._history.length == 0)
                Core.$initializeAll();
        }
        static get $isCommitting() {
            return Global._state.$isCommitting;
        }
        static get $isConstructing() {
            return Global._state.$isConstructing;
        }
        static get $isRenderingProperty() {
            return Global._state.$isRenderingProperty;
        }
        static get $target() {
            return Global._state.$target;
        }
        static $isAccessible(observable) {
            return Global._state.$accessibles.has(observable);
        }
        static $setAccessible(observable) {
            Global._state.$accessibles.add(observable);
        }
    }
    Global._state = {
        $isCommitting: false,
        $isConstructing: false,
        $isRenderingProperty: false,
        $target: null,
        $accessibles: new Set()
    };
    Global._history = [];
    const $shrewdDecorators = Symbol('Shrewd Decorators');
    return Shrewd;
}));

//# sourceMappingURL=shrewd.js.map
