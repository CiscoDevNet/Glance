(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class Element
     * @namespace nxex.struct
     */
    var EXPORT = nx.define("nxex.struct.Element", nxex.struct.OptionElement, {
        events: ["capturehold", "capturetap", "capturetwice", "capturetransform", "capturedrag", "capturedragend", "captureend"],
        properties: {
            global: {
                value: global
            },
            resourceManager: {
                value: function () {
                    return new nxex.ResourceManager();
                }
            },
            structBaseType: {
                value: function () {
                    return EXPORT;
                }
            },
            /**
             * @property parentNode
             * @type {nxex.struct.Element}
             */
            parentNode: {
                watcher: function (pname, pvalue) {
                    if (nx.is(pvalue, EXPORT)) {
                        // keep synchronize with child nodes of parent node
                        var collection = pvalue.childNodes();
                        if (!collection.contains(this)) {
                            collection.add(this);
                        }
                    }
                }
            },
            /**
             * @property childNodes
             * @type {nx.data.ObservableCollection}
             */
            childNodes: {
                value: function () {
                    return new nx.data.ObservableCollection();
                },
                watcher: function (pname, collection, evt) {
                    var item;
                    if (evt) {
                        // TODO think more about memory leak
                        switch (evt.action) {
                        case "add":
                            item = evt.items[0];
                            // make sure the item has correct parent node
                            if (item.parentNode() !== this) {
                                item.attach(this);
                            }
                            // if once the parent node changed, remove from the collection and unwatch
                            var unwatcher = nx.Observable.watch(item, "parentNode", function (ignoreme, parentNode) {
                                if (parentNode !== this) {
                                    this.childNodes().remove(item);
                                    unwatcher.unwatch();
                                }
                            }, this);
                            break;
                        case "remove":
                            item = evt.items[0];
                            // if once the item is removed, make sure the item has correct parent node
                            if (item.parentNode() === this) {
                                item.detach();
                            }
                            break;
                        case "reset":
                        case "concat":
                        default:
                            // TODO
                            break;
                        }
                    }
                }
            }
        },
        methods: {
            init: function (options) {
                this.inherited(options);
                EXPORT.parse(this);
                annotation.apply(this, "watcher,cascade");
            },
            attach: function (parent, index) {
                this.inherited(parent, index);
                this.parentNode(parent);
            },
            detach: function () {
                this.parentNode(null);
                this.inherited();
            },
            dispose: function () {
                this.resourceManager().release();
                this.inherited();
            }
        },
        statics: {
            NO_RESOURCE: {
                release: nx.idle
            },
            extendProperty: function (view, name, value) {
                if (view[name]) {
                    // TODO handle name conflict
                    throw "View name conflict: " + name;
                }
                nx.Observable.extendProperty(view, name, {});
                view.set(name, value);
            },
            extendEvent: function (view, name) {
                if (view.can(name)) {
                    // TODO handle name conflict
                    throw "View event conflict: " + name;
                }
                nx.Object.extendEvent(view, name);
            },
            parse: function (element) {
                var structs = EXPORT.getStructs(element);
                var resm = element.resourceManager();
                nx.each(structs, function (struct) {
                    resm.retain(EXPORT.update(element, element, struct));
                });
            },
            getStructs: function (element) {
                var clazz = element.constructor;
                var structs = [],
                    struct;
                do {
                    struct = clazz["@struct"];
                    if (struct) {
                        // TODO validate structure configuration
                        structs.unshift(struct);
                    }
                    clazz = clazz.__super__;
                } while (clazz && clazz !== nxex.struct.Element);
                return structs;
            },
            update: function (self, view, $view) {
                var resources = [];
                // set as a named view
                if ($view.name) {
                    EXPORT.extendProperty(self, $view.name, view);
                }
                // bind event on 'view' to 'self'
                nx.each($view.events || {}, function (handler, name) {
                    if (nx.is(handler, "String")) {
                        handler = self[handler];
                    }
                    name = name.indexOf(" ") >= 0 ? name.split(" ") : [name];
                    nx.each(name, function (name) {
                        resources.push(view.on(name, handler, self));
                    });
                });
                // set properties of 'view'
                if ($view.properties) {
                    nx.each($view.properties, function (value, key) {
                        resources.push(EXPORT.updateProperty(self, view, key, value));
                    });
                }
                if (true || nx.is(view, nxex.struct.Element)) {
                    // set content of 'view' for only Element
                    var content = $view.content || [];
                    content = nx.is(content, Array) ? content : [content];
                    nx.each(content, function ($view) {
                        var child = EXPORT.create($view, view);
                        resources.push(EXPORT.attach(self, view, child));
                        resources.push(EXPORT.update(self, child, $view));
                    });
                    // set sub-view extending of 'view'
                    nx.each($view.extend || {}, function ($view, key) {
                        var child = view.get(key);
                        if (!child) {
                            child = EXPORT.create($view, view);
                            resources.push(EXPORT.attach(self, view, child));
                        }
                        resources.push(EXPORT.update(self, child, $view));
                    });
                    // call eventually at last
                    if ($view.eventually) {
                        if (nx.is($view.eventually, "String")) {
                            this[$view.eventually].call(self);
                        } else {
                            $view.eventually.call(self);
                        }
                    }
                }
                return {
                    release: function () {
                        while (resources.length) {
                            resources.shift().release();
                        }
                    }
                };
            },
            create: function ($view, parent) {
                var view, type;
                if (!$view // nil values
                    || typeof $view === 'string' // direct HTML value
                    || typeof $view === "number" // direct digit value
                    || nx.is($view, nx.ui.AbstractComponent) // direct component
                    || nx.is($view, nxex.struct.Binding) || nx.is($view, nxex.struct.Template)) {
                    view = $view;
                } else {
                    // create the view with specified $type and $tag
                    type = (typeof $view.type === "string") ? nx.path(window, $view.type) : $view.type;
                    type = (typeof type === "function") ? type : (parent && parent.structBaseType && parent.structBaseType() || EXPORT);
                    view = new type();
                }
                return view;
            },
            attach: function (self, view, child) {
                var resource;
                if (typeof child == "number") {
                    child = child + "";
                } else if (!child) {
                    child = "";
                }
                // append to the parent view
                if (nx.is(child, nx.ui.AbstractComponent)) {
                    // TODO any difference?
                    child.attach(view);
                    resource = {
                        release: function () {
                            child.detach();
                        }
                    };
                } else if (nx.is(child, "String")) {
                    resource = EXPORT.attachHtml(self, view, child);
                } else if (nx.is(child, nxex.struct.Binding)) {
                    resource = EXPORT.attachBinding(self, view, child);
                } else if (nx.is(child, nxex.struct.Template)) {
                    resource = child.bind(self, view);
                }
                return resource;
            },
            attachHtml: function (self, view, child) {
                // FIXME create element for HTML, etc.
                var container = document.createElement("div");
                container.innerHTML = child;
                var children = Array.prototype.slice.call(container.childNodes);
                // move children to view
                var dom = view.dom().$dom,
                    next;
                for (child = children[0]; child; child = next) {
                    next = child.nextSibling;
                    dom.appendChild(child);
                }
                return {
                    release: function () {
                        nx.each(children, function (child) {
                            dom.hasChildNodes(child) && dom.removeChild(child);
                        });
                    }
                };
            },
            attachBinding: function (self, view, child) {
                // FIXME
                var placeholder = document.createTextNode("");
                var dom = view.dom().$dom,
                    children = [];
                var resource = null;
                var bound = child.bind(self, function (pvalue) {
                    // FIXME position is important, too
                    resource && resource.release();
                    // create child if necessary
                    var childValue = EXPORT.create(pvalue, view);
                    resource = EXPORT.attach(self, view, childValue);
                    if (childValue !== pvalue) {
                        EXPORT.update(self, childValue, pvalue);
                    }
                });
                bound.affect();
                return {
                    release: function () {
                        resource && resource.release();
                        bound.release();
                    }
                };
            },
            updateProperty: function (self, view, key, value) {
                function set(o, key, value) {
                    if (o.has && o.has(key)) {
                        o.set(key, value);
                    } else if (o.resolve) {
                        o.dom().set(key, value);
                    }
                }
                if (key === "class") {
                    return EXPORT.updateClass(self, view, value);
                } else if (key === "style") {
                    return EXPORT.updateStyles(self, view, value);
                } else {
                    if (!nx.is(value, nxex.struct.Binding)) {
                        set(view, key, value);
                        return EXPORT.NO_RESOURCE;
                    } else {
                        var bound = value.bind(self, function (pvalue) {
                            set(view, key, pvalue);
                        });
                        bound.affect();
                        return bound;
                    }
                }
            },
            updateClass: function (self, view, value) {
                // FIXME for deep recursive, return release instead of update resource manager
                if (nx.is(value, nxex.struct.Binding)) {
                    return EXPORT.updateClassBinding(self, view, value);
                } else {
                    var resources = [];
                    if (nx.is(value, "String")) {
                        nx.each(value.split(" "), function (value) {
                            resources.push(EXPORT.updateClassValue(self, view, value));
                        });
                    } else if (nx.is(value, Array)) {
                        nx.each(value, function (value) {
                            resources.push(EXPORT.updateClass(self, view, value));
                        });
                    }
                    return {
                        release: function () {
                            while (resources.length) {
                                resources.shift().release();
                            }
                        }
                    };
                }
            },
            updateClassValue: function (self, view, value) {
                var dom = view.dom();
                value && dom.addClass(value);
                return {
                    release: function () {
                        if (dom) {
                            value && dom.removeClass(value);
                            dom = null;
                        }
                    }
                };
            },
            updateClassBinding: function (self, view, value) {
                var dom = view.dom();
                var resource = null;
                var bound = value.bind(self, function (pvalue) {
                    resource && resource.release();
                    if (pvalue) {
                        resource = EXPORT.updateClass(self, view, pvalue);
                    } else {
                        resource = null;
                    }
                });
                bound.affect();
                return {
                    release: function () {
                        resource && resource.release();
                        bound.release();
                    }
                };
            },
            updateStyles: function (self, view, value) {
                var resources = [];
                nx.each(value, function (value, key) {
                    resources.push(EXPORT.updateStyle(self, view, key, value));
                });
                return {
                    release: function () {
                        while (resources.length) {
                            resources.shift().release();
                        }
                    }
                };
            },
            updateStyle: function (self, view, key, value) {
                if (nx.is(value, nxex.struct.Binding)) {
                    return EXPORT.updateStyleBinding(self, view, key, value);
                } else {
                    return EXPORT.updateStyleValue(self, view, key, value);
                }

            },
            updateStyleValue: function (self, view, key, value) {
                var dom = view.resolve("@root");
                var lastvalue = dom.hasStyle(key) ? dom.getStyle(key) : null;
                var kv = toolkit.css.standardize(key, value);
                dom.setStyle(kv.key, kv.value);
                return {
                    release: function () {
                        if (lastvalue) {
                            dom.setStyle(kv.key, lastvalue);
                        } else {
                            dom.removeStyle(kv.key);
                        }
                    }
                };
            },
            updateStyleBinding: function (self, view, key, value) {
                var dom = view.dom();
                var resource = null;
                var bound = value.bind(self, function (pvalue) {
                    resource && resource.release();
                    if (pvalue) {
                        // TODO handle further binding
                        resource = EXPORT.updateStyle(self, view, key, pvalue);
                    } else {
                        resource = null;
                    }
                });
                bound.affect();
                return {
                    release: function () {
                        resource && resource.release();
                        bound.release();
                    }
                };
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
