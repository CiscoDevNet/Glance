(function(nx) {
    var KEYWORDS = ["name", "events", "properties", "content", "extend"];

    var rSingleStringBinding = /^\{([^\}]*)\}$/;
    var rStringBinding = /\{([^\}]*)\}/g;
    var rBlank = /\s/g;

    var EXPORT = nx.define("nx.Hierarchical", {
        properties: {
            parent: null,
            childDefaultType: "nx.Hierarchical",
            childList: {
                set: function() {
                    throw new Error("Unable to set child list out of Hierarchical.");
                }
            },
            hierarchicalSyncParent: nx.binding("childList", function(childList) {
                var self = this;
                this.release("hierarchicalSyncParent");
                if (nx.is(childList, nx.List)) {
                    this.retain("hierarchicalSyncParent", childList.monitorDiff(function(evt) {
                        nx.each(evt.diffs, function(diff, idx) {
                            var drops = evt.drops[idx];
                            var joins = evt.joins[idx];
                            nx.each(drops, function(drop) {
                                if (nx.is(drop, EXPORT)) {
                                    drop.parent(null);
                                }
                            });
                            nx.each(joins, function(join) {
                                if (nx.is(join, EXPORT)) {
                                    join.parent(self);
                                }
                            });
                        });
                    }));
                }
            })
        },
        methods: {
            init: function() {
                this.inherited();
                // initialize the child list
                this._childList = new nx.List();
                this.notify("childList");
                // initialize the hierarchical definitions
                this.initHierarchical();
            },
            initHierarchical: function() {
                var instance = this;
                var clazz = instance.constructor;
                // get instance's hierarchies of the whole inheritance
                var hierarchical, hierarchicals = [];
                do {
                    hierarchical = clazz.__meta__.hierarchical;
                    if (hierarchical) {
                        // TODO validate structure configuration
                        hierarchicals.unshift(hierarchical);
                    }
                    clazz = clazz.__super__;
                } while (clazz && clazz !== EXPORT);
                // initialize the element in order
                nx.each(hierarchicals, function(hierarchical) {
                    instance.__hierarchical__ = instance.__hierarchical__ || {};
                    nx.each(hierarchical, function(initializer, key) {
                        if (KEYWORDS.indexOf(key) >= 0) {
                            throw new Error("Cannot use hierarchical keyword: " + key);
                        }
                        if (instance.__hierarchical__[key]) {
                            // TODO conflict on inherit path
                        }
                        instance.__hierarchical__[key] = initializer;
                    });
                });
            },
            hierarchicalUpdate: function(meta, context) {
                var self = this;
                context = context || self;
                var resources = new nx.Object();
                // extend hierarchical configurations
                nx.each(self.__hierarchical__, function(hierarchical, key) {
                    if (meta[key]) {
                        resources.retain(hierarchical.call(self, meta[key], context));
                    }
                });
                // bind event on "self" to "context"
                nx.each(meta.events, function(handler, name) {
                    resources.retain(self.hierarchicalUpdateEvent(name, handler, context));
                });
                // set properties of "self"
                nx.each(meta.properties, function(value, key) {
                    resources.retain(self.hierarchicalUpdateProperty(key, value, context));
                });
                // set content of "self" for only Hierarchical
                resources.retain(self.hierarchicalAppend(meta.content, context));
                // set property-as-child extending of "self"
                nx.each(meta.extend, function(meta, key) {
                    var target = nx.path(self, key);
                    if (target) {
                        if (meta.type) {
                            throw new Error("Cannot specify type while extending existing self: " + key);
                        }
                        resources.retain(target.hierarchicalUpdate(meta, context));
                    } else {
                        // TODO key as path
                        // create if specified path not exists
                        target = EXPORT.create(self, meta);
                        // update the target
                        EXPORT.extendProperty(self, key, target);
                        resources.retain(target.hierarchicalUpdate(meta, context));
                    }
                });
                return resources;
            },
            hierarchicalAppend: function(meta, context, list) {
                var self = this;
                var binding, template;
                if (!meta && meta !== 0) {
                    // not an available meta
                    return nx.Object.IDLE_RESOURCE;
                } else if (nx.is(meta, Array)) {
                    return self.hierarchicalAppendArray(meta, context, list);
                } else if (typeof meta === "string") {
                    // text
                    return self.hierarchicalAppendString(meta, context, list);
                } else if (typeof meta === "number") {
                    // number
                    return self.hierarchicalAppendNumber(meta, context, list);
                } else if (nx.is(meta, EXPORT)) {
                    // Hierarchical
                    return self.hierarchicalAppendChildren([meta], context, list);
                } else if (meta instanceof nx.binding) {
                    // binding
                    return self.hierarchicalAppendBinding(meta, context, list);
                } else if (!nx.is(meta, nx.Object) && meta.existence) {
                    // conditional existence
                    return self.hierarchicalAppendObjectExistence(meta, context, list);
                } else if (meta instanceof nx.template || !nx.is(meta, nx.Object) && meta.repeat) {
                    // template
                    template = EXPORT.getTemplateByObject(meta) || meta;
                    return self.hierarchicalAppendTemplate(template, context, list);
                } else {
                    // default
                    return self.hierarchicalAppendObject(meta, context, list);
                }
            },
            hierarchicalAppendObject: function(meta, context, list) {
                var self = this;
                var resources = new nx.Object();
                var child, binding;
                binding = EXPORT.getBindingIfString(meta.type);
                if (binding) {
                    meta = nx.clone(meta); // not deep clone
                    context = context || self;
                    list = EXPORT.getFlatList(self, false, list);
                    resources.retain(list);
                    // bind to the list
                    resources.retain(nx.Object.binding(context, binding, function(result) {
                        resources.release("recursive");
                        meta.type = result;
                        resources.retain("recursive", self.hierarchicalAppendObject(meta, context, list));
                    }));
                } else {
                    // meta
                    child = EXPORT.create(self, meta);
                    // set as a named child
                    if (meta.name) {
                        // TODO if binding
                        EXPORT.extendProperty(context, meta.name, child);
                    }
                    // update the child
                    if (nx.is(child, EXPORT)) {
                        child.retain(child.hierarchicalUpdate(meta, context));
                    }
                    // update resources
                    resources.retain(child);
                    resources.retain(self.hierarchicalAppendChildren([child], context, list));
                }
                return resources;
            },
            hierarchicalAppendArray: function(meta, context, list) {
                var self = this;
                var resources = new nx.Object();
                nx.each(meta, function(meta) {
                    resources.retain(self.hierarchicalAppend(meta, context, list));
                });
                return resources;
            },
            hierarchicalAppendString: function(meta, context, list) {
                var self = this;
                // check string-style-binding
                binding = EXPORT.getBindingIfString(meta);
                if (binding) {
                    // string-style-binding
                    return self.hierarchicalAppendBinding(binding, context, list);
                }
                return nx.Object.IDLE_RESOURCE;
            },
            hierarchicalAppendNumber: function(meta, context, list) {
                return nx.Object.IDLE_RESOURCE;
            },
            hierarchicalAppendChildren: function(children, context, list) {
                var self = this;
                var resources = new nx.Object();
                context = context || self;
                list = EXPORT.getFlatList(self, true, list);
                // append children to self
                list.spliceAll(list.length(), 0, children);
                resources.retain({
                    release: function() {
                        if (children) {
                            // TODO optimize
                            list.remove.apply(list, children);
                            children = null;
                        }
                    }
                });
                return resources;
            },
            hierarchicalAppendObjectExistence: function(meta, context, list) {
                var self = this;
                context = context || self;
                // bind to the list
                var resources = new nx.Object();
                var binding, resources, existence;
                binding = EXPORT.getBindingIfString(meta.existence);
                meta = nx.extend({}, meta);
                delete meta.existence;
                // check if meta.existence is not binding
                if (!binding) {
                    return EXPORT.hierarchicalAppendObject(meta, context, list);
                }
                // process conditional existence
                resources = new nx.Object();
                existence = false;
                // bind to the list
                list = EXPORT.getFlatList(self, false, list);
                resources.retain(list);
                resources.retain(nx.Object.binding(context, binding, function(result) {
                    if (!!result !== existence) {
                        resources.release("recursive");
                        if (result) {
                            resources.retain("recursive", self.hierarchicalAppend(meta, context, list));
                        }
                    }
                }));
                return resources;
            },
            hierarchicalAppendBinding: function(binding, context, list) {
                var self = this;
                context = context || self;
                // bind to the list
                var resources = new nx.Object();
                list = EXPORT.getFlatList(self, false, list);
                resources.retain(list);
                resources.retain(nx.Object.binding(context, binding, function(result) {
                    resources.release("recursive");
                    resources.retain("recursive", self.hierarchicalAppend(result, context, list));
                }));
                return resources;
            },
            hierarchicalAppendTemplate: function(template, context, list) {
                var self = this;
                context = context || self;
                var resources = new nx.Object()
                list = EXPORT.getFlatList(self, false, list);
                resources.retain(list);
                resources.retain(new nx.HierarchicalTemplate(self, list, template, context));
                return resources;
            },
            hierarchicalUpdateEvent: function(name, handler, context) {
                var self = this;
                var resources = new nx.Object();
                // preprocess handler
                if (typeof handler === "string") {
                    if (context[handler] && context[handler].__type__ === "method") {
                        handler = context[handler];
                    } else {
                        handler = EXPORT.getBindingIfString(handler, true);
                    }
                }
                // bind or listen on event
                if (handler) {
                    if (nx.is(handler, nx.binding)) {
                        resources.retain(nx.Object.binding(context, handler, function(pvalue) {
                            resources.release("recursive");
                            resources.retain("recursive", self.hierarchicalUpdateEvent(name, pvalue, context));
                        }));
                    } else if (typeof handler === "function") {
                        name = name.indexOf(" ") >= 0 ? name.split(" ") : [name];
                        nx.each(name, function(name) {
                            resources.retain(self.on(name, handler, context));
                        });
                    }
                }
                return resources;
            },
            hierarchicalUpdateProperty: function(key, value, context) {
                var self = this;
                context = context || self;
                // parse "{xxx}"
                value = EXPORT.getBindingIfString(value) || value;
                if (nx.is(value, nx.binding)) {
                    var resources = new nx.Object();
                    return nx.Object.binding(context, value, function(pvalue) {
                        resources.release("recursive");
                        resources.retain("recursive", self.hierarchicalUpdateProperty(key, pvalue, context));
                    });
                    return resources;
                }
                return this.hierarchicalUpdatePropertyValue(key, value, context);
            },
            hierarchicalUpdatePropertyValue: function(key, value, context) {
                var self = this;
                nx.path(self, key, value);
                return nx.Object.IDLE_RESOURCE;
            }
        },
        statics: {
            extendProperty: function(owner, name, value) {
                if (owner[name]) {
                    // TODO handle name conflict
                    if (!nx.SILENT) {
                        console.warn("Property name conflict: " + name);
                    }
                }
                nx.Object.extendProperty(owner, name, {}, true);
                nx.path(owner, name, value);
            },
            create: function(parent, meta) {
                var type, child;
                // create the child with specified type
                type = (typeof meta.type === "string") ? nx.path(global, meta.type) : meta.type;
                type = (typeof type === "function") ? type : (parent && parent.childDefaultType && parent.childDefaultType());
                type = (typeof type === "string") ? nx.path(global, type) : type;
                type = type || EXPORT;
                child = new type();
                return child;
            },
            getFlatListAppendList: function(group, plain) {
                var tmp, last;
                if (plain) {
                    // prepare a plain list
                    last = new nx.List();
                    last._flat = {
                        plain: true,
                        group: group,
                        index: group.length()
                    };
                } else {
                    // prepare a non-plain list
                    last = nx.List.concatenate(tmp = new nx.List());
                    tmp._hierarchical_concatenated = last;
                    last._hierarchical_concatenate = tmp;
                    last._flat = {
                        group: group,
                        index: group.length()
                    };
                    last.retain({
                        release: function() {
                            group.remove(last);
                        }
                    });
                }
                group.push(last);
                return last;
            },
            getFlatList: function(target, plain, orig_list) {
                // get the default list
                var list, last;
                last = list = orig_list || target._childList;
                // get or create the target list
                var group, flat, tmp, create;
                if (list._flat && !list._flat.plain) {
                    group = list._hierarchical_concatenate;
                    if (!plain) {
                        last = EXPORT.getFlatListAppendList(group, false);
                    } else {
                        last = group.get(-1);
                        if (!last || last._flat && !last._flat.plain) {
                            last = EXPORT.getFlatListAppendList(group, true);
                        }
                    }
                } else {
                    if (!plain) {
                        // check if replacement necessary
                        if (list === target._childList) {
                            // prepare a non-plain list to replace plain list
                            group = new nx.List([list]);
                            flat = nx.List.concatenate(group);
                            group._hierarchical_concatenated = flat;
                            flat._hierarchical_concatenate = group;
                            flat._flat = list._flat || {};
                            delete flat._flat.plain;
                            // replace list by flat and notify the child list change
                            target._childList = flat;
                            target.notify("childList");
                            // update the old list
                            list._flat = {
                                plain: true,
                                group: group,
                                index: 0
                            };
                        } else {
                            // use the owner group
                            group = list._flat.group;
                        }
                        // prepare the new list
                        last = EXPORT.getFlatListAppendList(group, false);
                    } else if (list !== target._childList) {
                        // get the owner group
                        group = list._flat.group;
                        last = group.get(-1);
                        if (!last || last._flat && !last._flat.plain) {
                            last = EXPORT.getFlatListAppendList(group, true);
                        }
                    }
                }
                return last;
            },
            getStringBindingByString: function(base) {
                if (base.indexOf("{") >= 0) {
                    if (rSingleStringBinding.test(base)) {
                        return nx.binding(base.substring(1, base.length - 1));
                    }
                    var keys = [];
                    var replacements = {};
                    base.replace(rStringBinding, function(match, key, index) {
                        key = key.replace(rBlank, "");
                        if (key) {
                            if (keys.indexOf(key) === -1) {
                                keys.push(key);
                            }
                            var replacement = replacements[key] = replacements[key] || [];
                            if (replacement.indexOf(match) === -1) {
                                replacement.push(match);
                            }
                        }
                        return "";
                    });
                    // create binding if has key
                    if (keys.length) {
                        return nx.binding(keys, function() {
                            var args = arguments;
                            var result = base;
                            nx.each(keys, function(key, idx) {
                                var value = args[idx];
                                if (typeof value !== "string") {
                                    if (typeof value === "number") {
                                        value = "" + value;
                                    } else if (!value) {
                                        // false/null/undefined/NaN/...
                                        value = "false";
                                    } else if (nx.is(value, nx.Object)) {
                                        value = value.__id__;
                                    } else {
                                        value = "true";
                                    }
                                }
                                nx.each(replacements[key], function(r) {
                                    result = result.replace(r, value);
                                });
                            });
                            return result;
                        });
                    }
                }
                // has not a binding
                return null;
            },
            getBindingIfString: function(value, force) {
                if (nx.is(value, nx.binding)) {
                    return value;
                }
                var binding, path;
                binding = path = null;
                // since model is not a pass-through property any further, {path.from.self} would be more useful
                if (value && typeof value === "string") {
                    // FIXME parse the expression
                    if (value.charAt(0) === "{" && value.charAt(value.length - 1) === "}") {
                        path = value.substring(1, value.length - 1);
                    } else if (force) {
                        path = value;
                    }
                }
                return binding || path && nx.binding(path);
            },
            getTemplateByObject: function(config) {
                if (!config || nx.is(config, nx.template)) {
                    return config;
                }
                var binding, value = config.repeat;
                if (nx.is(value, nx.binding)) {
                    binding = value;
                } else if (nx.is(value, Array)) {
                    binding = nx.binding(function() {
                        return value;
                    });
                } else if (value && typeof value === "string") {
                    if (value.charAt(0) === "{" && value.charAt(value.length - 1) === "}") {
                        value = value.substring(1, value.length - 1);
                    }
                    binding = nx.binding(value);
                }
                config = nx.extend({}, config);
                delete config.repeat;
                return binding && nx.template(binding, config);
            }
        }
    });
})(nx);

flattree = function(list) {
    treeof = function(list) {
        var tree = [list.__id__];
        nx.each(list._hierarchical_concatenate, function(subtree) {
            tree.push(treeof(subtree));
        });
        return tree;
    };
    var t = treeof(list);
    var line = [];
    while (list && list._flat && list._flat.group && list._flat.group._hierarchical_concatenated) {
        line.unshift(list._flat.group._hierarchical_concatenated.__id__);
        list = list._flat.group._hierarchical_concatenated;
    }
    return [line.join(">") + ">", JSON.stringify(t)]
};
