(function(nx) {

    var global = nx.global;
    var hasown = Object.prototype.hasOwnProperty;
    var slice = Array.prototype.slice;
    var inMixin = function(clazz, type, marks) {
        marks = marks || {};
        var i, mixin, mixins = clazz.__mixins__ || [];
        for (i = 0; i < mixins.length; i++) {
            mixin = mixins[i];
            // mark as checked
            if (!marks[mixin.__id__]) {
                marks[mixin.__id__] = true;
            }
            if (mixin === type || mixin.prototype instanceof type) {
                return true;
            }
            if (isMixin(mixin, type, marks)) {
                return true;
            }
        }
    };

    /**
     * The base of any Classes defined in nx framework.
     * @class nx.Object
     * @constructor
     */
    function NXObject() {
        this.__id__ = nx.serial();
        this.__listeners__ = {};
        this.__watchers__ = {};
        this.__resources__ = {};
        this.__properties__ = nx.extend({}, this.__properties__);
        this.__methods__ = nx.extend({}, this.__methods__);
        this.self = this;
    }

    var NXPrototype = {
        constructor: NXObject,
        __nx__: true,
        __class__: NXObject,
        __namespace__: "nx.Object",
        __properties__: {},
        __methods__: {},
        __mixins__: [],
        __initializers__: [],
        global: global,
        /**
         * Call overridden method from super class
         * @method inherited
         */
        inherited: function(arg0) {
            var args = nx.is(arg0, "Arguments") ? arg0 : arguments;
            var caller = this.inherited.caller;
            var Super, Class, base = caller.__super__;
            if (caller.__name__ !== "init") {
                return base && base.apply(this, args);
            } else {
                // initialize super class if need
                if (base) {
                    Super = base.__class__;
                } else {
                    Super = base = NXObject;
                }
                if (!this.__type_initialized__[Super.__id__]) {
                    this.__type_initialized__[Super.__id__] = true;
                    base.apply(this, args);
                }
                // initialize my mixins
                Class = caller.__class__;
                nx.each(Class.__mixins__, function(mixin) {
                    if (!this.__type_initialized__[mixin.__id__]) {
                        this.__type_initialized__[mixin.__id__] = true;
                        mixin.__ctor__.call(this);
                    }
                }, this);
                // initialize my initializers
                nx.each(Class.__initializers__, function(initializer) {
                    initializer.initialize.call(this);
                }, this);
            }
        },
        /**
         * Retain or replace a resource.
         * If it's a replacing, the previous resource will be released.
         * 
         * @method retain
         * @param key Optional. If key specified, the previous resource will be released before the new resource added.
         * @param resource Optional. The resource to be retained. Could be a method which generates the resource.
         * @return The retained resource
         */
        retain: function(key, resource) {
            var argc = arguments.length;
            if (argc === 0) {
                return !this.__released__;
            }
            if (argc < 2) {
                if (typeof key === "string") {
                    return this.__resources__[key];
                }
                // TODO what if already retained
                return this.retain(nx.serial(), key);
            }
            // release the previous resource
            if (this.__resources__[key]) {
                if (this.__resources__[key] === resource) {
                    return resource;
                }
                this.__resources__[key].release();
            }
            // resource could be supplied as a factory function
            while (typeof resource === "function") {
                resource = resource.call(this);
            }
            // retain the resource
            if (resource && typeof resource.release === "function") {
                this.__resources__[key] = resource;
                return resource;
            } else {
                delete this.__resources__[key];
            }
        },
        /**
         * release all currently occurring resources.
         * @method release
         */
        release: function(key) {
            if (key === undefined) {
                this.__released__ = true;
                nx.each(this.__resources__, function(resource) {
                    resource && resource.release();
                });
                this.__resources__ = {};
            } else {
                if (this.__resources__[key]) {
                    this.__resources__[key].release();
                    delete this.__resources__[key];
                }
            }
        },
        /**
         * Add an event handler.
         * @method on
         * @param name {String}
         * @param handler {Function}
         * @param [context] {Object}
         */
        on: function(name, handler, context) {
            var map = this.__listeners__;
            var listeners = map[name] = map[name] || {
                size: 0
            };
            var id = nx.serial();
            var listener = {
                owner: this,
                handler: handler,
                context: context || this
            };
            listeners[id] = listener;
            listeners.size++;
            if (listeners.size === 1) {
                // first bind on the the event
                listener.owner.fire("+" + name);
            }
            return {
                id: id,
                release: function() {
                    if (hasown.call(listeners, id)) {
                        delete listeners[id];
                        listeners.size--;
                        if (!listeners.size) {
                            // last release on the event
                            listener.owner.fire("-" + name);
                        }
                    }
                }
            };
        },
        /**
         * Trigger an event.
         * @method fire
         * @param name {String}
         * @param [data] {*}
         */
        fire: function(name) {
            var args = slice.call(arguments, 1);
            var id, listener, existing = this.__listeners__[name];
            for (id in existing) {
                listener = existing[id];
                if (listener && listener.handler) {
                    result = listener.handler.apply(listener.context, [listener.owner].concat(args));
                    if (result === false) {
                        return false;
                    }
                }
            }
        },
        /**
         * @method
         * @param names
         * @param handler
         * @param context
         */
        watch: function(name, handler, context) {
            if (typeof handler !== "function") {
                return;
            }
            var map = this.__watchers__;
            var watchers = map[name] = map[name] || {
                size: 0
            };
            var owner = this;
            var id = nx.serial();
            var property = this[name];
            // add registry item on watchers
            var watcher = watchers[id] = {
                id: id,
                owner: this,
                name: name,
                handler: handler,
                affect: function(oldValue) {
                    // release previous resource
                    watcher.resource && watcher.resource.release();
                    // call the handler with new value
                    var resource;
                    var value = owner.__get__(name);
                    // use value itself as old value because the real old value is missing
                    resource = handler.call(context || owner, name, value, oldValue, owner);
                    if (resource && typeof resource.release === "function") {
                        watcher.resource = resource;
                    }
                }
            };
            // update watcher count and mark the property watched
            watchers.size++;
            // affect immediately
            // TODO use undefined or current value as old vlaue?
            watcher.affect();
            return {
                release: function() {
                    // release resource of watcher
                    watcher.resource && watcher.resource.release();
                    // clear the registry item on watchers
                    delete watchers[id];
                    // check the watcher count to update "watched" mark
                    if (!--watchers.size) {
                        delete map[name];
                    }
                }
            };
        },
        /**
         * @method notify
         * @param names
         * @param oldValue
         */
        notify: function(name, oldValue) {
            var id, watchers = this.__watchers__[name];
            for (id in watchers) {
                if (id !== "size") {
                    watchers[id].affect(oldValue);
                }
            }
        },
        __is__: function(type) {
            // understand type as path if string given
            if (typeof type === "string") {
                type = nx.path(global, type);
            }
            // make sure it's a class
            if (typeof type !== "function" || !type.__nx__) {
                return false;
            }
            // check the type
            if (this instanceof type) {
                return true;
            } else if (inMixin(this.__class__, type)) {
                return true;
            }
            return false;
        },
        __has__: function(name) {
            var member = this[name];
            return member && member.__type__ == 'property';
        },
        __get__: function(name) {
            var member = this[name];
            if (member && member.__type__ == 'property') {
                return member.call(this);
            } else {
                return member;
            }
        },
        __set__: function(name, value) {
            var member = this[name];
            if (!member && !hasown.call(this, name)) {
                NXObject.extendProperty(this, name, {});
                member = this[name];
            }
            if (typeof member === "function" && member.__type__ == 'property') {
                return member.call(this, value);
            } else {
                throw new Error("Unable to set property: " + name);
            }
        }
    };

    nx.extend(NXObject, {
        prototype: NXPrototype,
        __meta__: {},
        __nx__: true,
        __id__: nx.serial(),
        __namespace__: NXPrototype.__namespace__,
        __methods__: NXPrototype.__methods__,
        __properties__: NXPrototype.__properties__,
        __ctor_idle__: true,
        __mixins__: [],
        __initializers__: [],
        IDLE_RESOURCE: {
            release: nx.idle
        },
        /**
         * Define a property and attach to target.
         * @method extendProperty
         * @static
         * @param target {Object}
         * @param name {String}
         * @param meta {Object}
         * @param immediate {Boolean} Optional. Apply the value immediately after extend the propery or not. Default false.
         */
        extendProperty: function extendProperty(target, name, meta, immediate) {
            if (nx.is(meta, nx.binding) || !nx.is(meta, "Object")) {
                meta = {
                    value: meta
                };
            }
            var property;
            // prepare meta of property
            var _name, binding, initializer;
            _name = "_" + name;
            if (meta.value instanceof nx.binding) {
                binding = meta.value;
            } else if ((meta.dependencies || meta.async) && (!hasown.call(meta, "value") || typeof meta.value === "function")) {
                binding = nx.binding({
                    paths: nx.is(meta.dependencies, "String") ?
                        meta.dependencies.replace(/\s/g, "").split(",") : meta.dependencies,
                    async: meta.async,
                    handler: (typeof meta.value === "function") && meta.value
                });
            } else {
                // actually not a binding
                binding = meta.value;
            }
            // access creator
            var accessor = function() {
                return function(value, params) {
                    if (value === undefined && arguments.length === 0) {
                        return property.__getter__ ?
                            property.__getter__.call(this) :
                            this[_name];
                    } else {
                        var oldValue = property.__getter__ ?
                            property.__getter__.call(this) :
                            this[_name];
                        if (property.__equal__ ? property.__equal__(oldValue, value) : (oldValue !== value)) {
                            if (property.__setter__) {
                                if (property.__setter__.call(this, value, params) !== false && this.__watchers__[name]) {
                                    this.notify(name, oldValue);
                                }
                            } else {
                                this[_name] = value;
                                this.__watchers__[name] && this.notify(name, oldValue);
                            }
                        }
                        return value;
                    }
                };
            };
            // create or update property
            if (typeof target[name] !== "function") {
                property = accessor();
                nx.extend(property, {
                    __type__: "property",
                    __name__: name,
                    __meta__: nx.extend({}, meta),
                    __binding__: binding,
                    __getter__: meta.get,
                    __setter__: meta.set,
                    __equal__: (typeof meta.equalityCheck === "function") && meta.equalityCheck,
                    __watchers__: typeof meta.watcher === "function" ? [meta.watcher] : []
                });
                target[name] = property;
            } else {
                // property already exists
                if (hasown.call(target, name)) {
                    property = target[name];
                } else {
                    property = accessor();
                    nx.extend(property, {
                        __type__: "property",
                        __name__: name,
                        __meta__: nx.extend({}, meta),
                        __binding__: target[name].__binding__,
                        __get__: target[name].__get__,
                        __set__: target[name].__set__,
                        __equal__: target[name].__equal__,
                        __watchers__: target[name].__watchers__.slice()
                    });
                    target[name] = property;
                }
                if (property.__type__ !== "property") {
                    // TODO report an exception
                    return;
                }
                if (binding || hasown.call(meta, "value") && meta.value === binding) {
                    // FIXME think about how to inherit a binding
                    property.__binding__ = binding;
                }
                if (meta.get) {
                    meta.get.__super__ = property.__getter__;
                    property.__getter__ = meta.get;
                }
                if (meta.set) {
                    meta.set.__super__ = property.__setter__;
                    property.__setter__ = meta.set;
                }
                if (typeof meta.equalityCheck === "function") {
                    property.__equal__ = meta.equalityCheck;
                }
                if (typeof meta.watcher === "function") {
                    property.__watchers__.push(meta.watcher);
                }
            }

            target.__properties__[name] = property.__meta__;

            initializer = {
                initialize: function() {
                    var property = this[name];
                    var resource, value;
                    value = typeof property.__binding__ === "function" ? property.__binding__.call(this) : property.__binding__;
                    if (value instanceof nx.binding) {
                        resource = NXObject.affectBinding(this, name, value);
                        this.retain(resource);
                    } else if (hasown.call(meta, "value")) {
                        property.call(this, value);
                    }
                    var i, n = property.__watchers__.length;
                    for (var i = 0; i < n; i++) {
                        this.retain(this.watch(name, property.__watchers__[i]));
                    }
                }
            };

            if (immediate) {
                initializer.initialize.call(target);
            }
            return initializer;
        },
        /**
         * Define a method and attach to target.
         * @method extendMethod
         * @static
         * @param target {Object}
         * @param name {String}
         * @param method {Function}
         */
        extendMethod: function extendMethod(target, name, method) {
            var exist = target[name] && target[name].__type__ == 'method';

            if (target[name] && target[name] !== method) {
                method.__super__ = target[name];
            }

            method.__name__ = name;
            method.__type__ = 'method';
            method.__meta__ = {};

            target[name] = method;
            target.__methods__[name] = method;
        },
        /**
         * Recursively affect a binding, and call the callback with final result.
         * The operator of asynchronize binding could be extend for more information.
         * 
         * @method binding
         * @static
         * @param context {nx.Object}
         * @param binding {nx.binding}
         * @param callback {Function} For handling the final result.
         * @param extend {Object} Extension of asynchronize operator.
         */
        binding: function(context, binding, callback, extend) {
            if (!binding) {
                return NXObject.IDLE_RESOURCE;
            }
            var operator, resources = new NXObject;
            // create an operator of the asynchronize operator
            operator = nx.extend({}, extend, {
                set: function(value, param) {
                    resources.release("recursive");
                    if (value instanceof nx.binding) {
                        resources.retain("recursive", NXObject.binding(context, value, callback, extend));
                    } else {
                        return callback.call(context, value, param);
                    }
                }
            });
            // to call or bind the handler
            if (!binding.paths || !binding.paths.length) {
                if (binding.async && binding.handler) {
                    resources.retain("async", binding.handler.call(context, operator));
                } else {
                    operator.set(binding.handler ?
                        binding.handler.call(context) :
                        nx.path(context, binding.paths[0]));
                }
            } else {
                // to bind the handler asynchronizely or not
                if (binding.async && binding.handler) {
                    resources.retain(NXObject.cascade(context, binding.paths, function() {
                        var args = slice.call(arguments);
                        args.unshift(operator);
                        resources.retain("async", binding.handler.apply(context, args));
                    }));
                } else {
                    resources.retain(NXObject.cascade(context, binding.paths, function(value0) {
                        operator.set(binding.handler ?
                            binding.handler.apply(context, arguments) :
                            value0);
                    }));
                }
            }
            return resources;
        },
        /**
         * Affect a binding to an property.
         * @static
         * @method affectBinding
         * @param target The target object.
         * @param path The binding to be affect.
         * @return Resource stub object, with release and affect methods.
         *  <p>release: unwatch the current watching.</p>
         *  <p>affect: invoke the callback with current value immediately.</p>
         */
        affectBinding: function(target, name, binding) {
            var resource, recursive, operator, property = target[name];
            if (property) {
                return NXObject.binding(target, binding, property, {
                    get: property.bind(target)
                });
            }
            return NXObject.IDLE_RESOURCE;
        },
        /**
         * This method in order to watch the change of specified path of specified target.
         * @static
         * @method watch
         * @param target The target observable object.
         * @param path The path to be watched.
         * @param callback The callback function accepting arguments list: (path, newvalue, oldvalue).
         * @param context (Optional) The context which the callback will be called with.
         * @return Resource stub object, with release and affect methods.
         *  <p>release: unwatch the current watching.</p>
         *  <p>affect: invoke the callback with current value immediately.</p>
         */
        watch: function(target, path, callback, context) {
            var keys = (typeof path === "string" ? path.replace(/\s/g, "").split(".") : path);
            var iterate = function(value, oldValue, keys) {
                if (!value) {
                    return callback.call(context || target, path, value, nx.path(oldValue, keys));
                }
                if (!keys.length) {
                    return callback.call(context || target, path, value, oldValue);
                }
                if (nx.is(value, nx.Object)) {
                    return value.watch(keys[0], function(key, value, oldValue) {
                        return iterate(value, oldValue, keys.slice(1));
                    });
                } else {
                    return iterate(nx.path(value, keys[0]), nx.path(oldValue, keys[0]), keys.slice(1));
                }
            };
            return iterate(target, undefined, keys);
        },
        /**
         * Cascade several paths of target at the same time, any value change of any path will trigger the callback with all values of all paths.
         * @static
         * @method cascade
         * @param target The target observable object.
         * @param pathlist The path list to be watched.
         * @param callback The callback function accepting arguments list: (value1, value2, value3, ..., changed_path, changed_old_value).
         * @return The cascading resource retaining all sub-bindings.
         *  <p>release: release the current cascading.</p>
         *  <p>affect: invoke the callback with current values immediately.</p>
         */
        cascade: function(target, pathlist, callback, context) {
            if (!target || !pathlist || !callback) {
                return;
            }
            // apply the cascading
            var resources = new nx.Object();
            var i, paths, values;
            paths = typeof pathlist === "string" ? pathlist.replace(/\s/g, "").split(",") : pathlist;
            values = [];
            var affect = function(path, oldValue) {
                var args = values.slice();
                if (path) {
                    args.push(path, oldValue);
                }
                callback.apply(context || target, args);
            };
            nx.each(paths, function(path, idx) {
                values[idx] = nx.path(target, path);
            });
            nx.each(paths, function(path, idx) {
                resources.retain(NXObject.watch(target, paths[idx], function(path, value) {
                    var oldValue = values[idx];
                    // TODO TBD: what if not changed but notified?
                    if (oldValue !== value) {
                        values[idx] = value;
                        affect(paths[idx], oldValue);
                    }
                }));
            });
            affect(null, null);
            return resources;
        }
    });

    nx.Object = NXObject;

})(nx);
