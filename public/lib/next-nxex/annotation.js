(function (nx, position, dom, ui, toolkit, global) {

    /**
     * @class nxex.annotation.Annotation
     */
    var Annotation = nx.define(nx.Observable, {
        properties: {
            /**
             * @property target
             */
            target: {}
        },
        methods: {
            /**
             * @method enable
             * @abstract
             */
            enable: toolkit.idle,
            /**
             * @method disable
             * @abstract
             */
            disable: toolkit.idle
        }
    });

    /**
     * @class nxex.annotation.PropertyAnnotation
     * @super nxex.annotation.Annotation
     */
    var PropertyAnnotation = nx.define(Annotation, {
        properties: {
            registry: {
                value: function () {
                    return [];
                }
            }
        },
        methods: {
            enable: function () {
                // scan to prepare the registry
                this._scan();
                // start to enable the annotation
                var target = this.target();
                var i, reg, registry = this.registry();
                // sort the registry if necessary
                if (this.compare !== toolkit.idle) {
                    registry.sort(function (p1, p2) {
                        return this.compare(p1.name, p2.name, p1.meta, p2.meta);
                    }.bind(this));
                }
                // register each property in order
                for (i = 0; i < registry.length; i++) {
                    reg = registry[i];
                    reg.resource = this.register(target, reg.name, reg.meta);
                }
            },
            disable: function () {
                var reg, registry = this.registry();
                while (registry.length) {
                    reg = registry.shift();
                    reg.resource && reg.resource.release();
                }
            },
            _scan: function () {
                var metakey = this.metakey();
                if (!metakey) {
                    return;
                }
                var registry = this.registry();
                // iterate all properties of the target
                PropertyAnnotation.eachProperty(this.target(), function (pname, pconf) {
                    if (pconf && typeof pconf[metakey] !== "undefined") {
                        if (!this._get(pname)) {
                            registry.push({
                                name: pname,
                                meta: pconf[metakey]
                            });
                        }
                    }
                }, this);
            },
            _get: function (pname) {
                var i, registry = this.registry();
                for (i = 0; i < registry.length; i++) {
                    if (registry[i].name === pname) {
                        return registry[i];
                    }
                }
                return null;
            },
            /**
             * @method metakey
             * @abstract
             * @result metakey
             */
            metakey: toolkit.idle,
            /**
             * @method compare
             * @abstract
             * @param name1,name2,meta1,meta2
             * @result compare result
             */
            compare: toolkit.idle,
            /**
             * @method register
             * @abstract
             * @param target,pname,pmeta
             * @result unregister function
             */
            register: toolkit.idle
        },
        statics: {
            eachProperty: function (o, callback, context) {
                var pname, pvalue, pmeta;
                for (pname in o) {
                    pvalue = o[pname];
                    if (typeof pvalue === "function" && typeof pvalue.getMeta === "function") {
                        pmeta = pvalue.getMeta();
                        callback.call(context || o, pname, pmeta);
                    }
                }
            }
        }
    });

    var EXPORT = nx.define("nxex.annotation", {
        statics: {
            Annotation: Annotation,
            PropertyAnnotation: PropertyAnnotation,
            apply: (function () {
                /**
                 * Get or create a annotation manager for the object.
                 */
                function enable(o) {
                        // FIXME The "destroy" method should be replaced on creating.
                        var destroyer = o.destroy;
                        var annotationman = destroyer._annotationman;
                        // if the annotation manager not created
                        if (!annotationman) {
                            // create one
                            annotationman = {
                                registry: [],
                                find: function (type) {
                                    var i, registry = annotationman.registry;
                                    for (i = 0; i < registry.length; i++) {
                                        if (registry[i].type === type) {
                                            return registry[i];
                                        }
                                    }
                                    return false;
                                },
                                apply: function (type) {
                                    var entry = annotationman.find(type);
                                    if (!entry) {
                                        entry = {
                                            type: type,
                                            instance: new type()
                                        };
                                        entry.instance.target(o);
                                        annotationman.registry.push(entry);
                                    }
                                    entry.instance.enable();
                                },
                                clear: function () {
                                    var entry, registry = annotationman.registry;
                                    while (registry.length) {
                                        entry = registry.shift();
                                        entry.instance.disable();
                                    }
                                }
                            };
                            // replace the destroyer of object
                            o.destroy = function () {
                                // finalize all annotations
                                annotationman.clear();
                                // call the last destroyer
                                var args = Array.prototype.slice.call(arguments);
                                destroyer.call(this);
                            };
                            // mark the annotation manager created
                            o.destroy._annotationman = annotationman;
                        }
                        return annotationman;
                    }
                    /**
                     * Apply an annotation to the target
                     */
                function apply(target, type) {
                    // get or create the corresponding annotation manager of target
                    var annotationman = enable(target);
                    // apply the annotation for the manager
                    annotationman.apply(type);
                }
                return function (o, clazz) {
                    if (typeof clazz === "string") {
                        // TODO split the string
                        clazz = clazz.replace(/\s/g, "").split(",");
                        while (clazz.length) {
                            EXPORT.apply(o, EXPORT.preset[clazz.shift()]);
                        }
                        return;
                    }
                    if (typeof clazz === "function") {
                        apply(o, clazz);
                    }
                };
            })(),
            preset: {
                KEY: function (o) {
                    var key, clazz = o.constructor,
                        map = EXPORT.preset;
                    for (key in map) {
                        if (map[key] === clazz) {
                            return key;
                        }
                    }
                },
                watcher: nx.define(PropertyAnnotation, {
                    methods: {
                        metakey: function () {
                            return EXPORT.preset.KEY(this) || this.inherited();
                        },
                        register: function (o, pname, pmeta) {
                            var watcher, resource;
                            if (typeof pmeta === "string" && o[pmeta]) {
                                watcher = o[pmeta];
                            } else {
                                watcher = pmeta;
                            }
                            resource = o.watch(pname, watcher);
                            resource.affect();
                            return resource;
                        }
                    }
                }),
                classman: nx.define(PropertyAnnotation, {
                    methods: {
                        metakey: function () {
                            return EXPORT.preset.KEY(this) || this.inherited();
                        },
                        register: function (o, pname, pmeta) {
                            if (!o.is(nx.ui.Element)) {
                                return;
                            }
                            // create the singleton class manager
                            var classman = {
                                self: o,
                                map: {},
                                add: function (name, cls) {
                                    var map;
                                    // get the "target:classes" map
                                    if (typeof name === "string") {
                                        map = {};
                                        map[name] = cls;
                                    } else {
                                        map = name;
                                    }
                                    // apply the classes
                                    nx.each(map, function (classes, name) {
                                        if (typeof classes === "string") {
                                            classes = classes.split(" ");
                                        }
                                        nx.each(classes, function (cls) {
                                            var target = (name == "this" ? classman.self : classman.self.$(name));
                                            var classes = classman.map[name] = classman.map[name] || [];
                                            target.addClass(cls);
                                            classes.push(cls);
                                        });
                                    });
                                },
                                clear: function () {
                                    nx.each(classman.map, function (classes, name) {
                                        var target = (name == "this" ? classman.self : classman.self.$(name));
                                        nx.each(classes, function (cls, idx) {
                                            target.removeClass(cls);
                                        });
                                    }.bind(o));
                                    classman.map = {};
                                }
                            };
                            var watcher = function (pname, pvalue) {
                                // clear recent classes
                                classman.clear();
                                // notify for class manager
                                pmeta.call(o, classman, pname, pvalue);
                            };
                            // watch
                            var resource = o.watch(pname, watcher, o);
                            resource.affect();
                        }
                    }
                }),
                cascade: nx.define(PropertyAnnotation, {
                    methods: {
                        metakey: function () {
                            return EXPORT.preset.KEY(this) || this.inherited();
                        },
                        compare: function (name1, name2, meta1, meta2) {
                            function dep(name, deps) {
                                deps = typeof deps === "string" ? deps.replace(/\s/g, "").split(",") : deps.slice();
                                while (deps.length) {
                                    if (deps.shift() === name) {
                                        return true;
                                    }
                                }
                                return false;
                            }
                            if (dep(name1, meta2.source || "")) {
                                return 1;
                            }
                            if (dep(name2, meta1.source || "")) {
                                return -1;
                            }
                            return 0;
                        },
                        register: function (o, pname, pmeta) {
                            var resource = nx.Observable.monitor(o, pmeta.source, function () {
                                var vals = Array.prototype.slice.call(arguments);
                                var pvalue;
                                if (!pmeta.output && !pmeta.update) {
                                    o[pname].call(o, vals[0]);
                                } else {
                                    if (pmeta.update) {
                                        pmeta.update.apply(o, vals);
                                    }
                                    if (pmeta.output) {
                                        pvalue = pmeta.output.apply(o, vals);
                                        o[pname].call(o, pvalue);
                                    }
                                }
                            });
                            resource.affect();
                            return resource;
                        }
                    }
                })
            }
        }
    });

})(nx, nx.position, nx.dom, nx.ui, nxex.toolkit, window);
