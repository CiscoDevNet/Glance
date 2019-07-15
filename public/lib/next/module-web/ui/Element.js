(function(nx) {

    var global = nx.global;

    var Hierarchical = nx.Hierarchical;
    var cssclass = nx.util.cssclass;
    var cssstyle = nx.util.cssstyle;

    var EXPORT = nx.define("nx.ui.Element", nx.Hierarchical, {
        properties: {
            xmlns: {
                set: function() {
                    throw new Error("Unable to set xmlns of Element.");
                }
            },
            dom: {
                set: function() {
                    throw new Error("Unable to set dom of Element.");
                },
                watcher: function(name, value) {
                    this.release("syncDomEvents");
                    if (nx.is(value, Element)) {
                        this.retain("syncDomEvents", this._sync_dom_events(value));
                    }
                }
            },
            childDefaultType: "nx.ui.Element",
            hierarchicalSyncDom: nx.binding("childList", function(childList) {
                this.release("hierarchicalSyncDom");
                nx.is(childList, nx.List) && this.retain("hierarchicalSyncDom", this._sync_child_list(childList));
            })
        },
        hierarchical: {
            capture: function(meta, context) {
                return this.hierarchicalUpdateCapture(meta, context);
            },
            cssclass: function(meta, context) {
                return this.hierarchicalUpdateClass(meta, context);
            },
            cssstyle: function(meta, context) {
                return this.hierarchicalUpdateStyles(meta, context);
            },
            attributes: function(meta, context) {
                return this.hierarchicalUpdateAttributes(meta, context);
            }
        },
        methods: {
            init: function(tag, xmlns) {
                this.inherited();
                this._xmlns = xmlns || "";
                if (tag instanceof Element) {
                    this._dom = tag;
                    // TODO init with existing DOM Element (important if SEO required)
                    this.notify("dom");
                } else {
                    // initialize xmlns and dom-element
                    if (xmlns) {
                        // TODO default tag for known namespaces and throw error for still missing tag
                        this._dom = document.createElementNS(xmlns, tag);
                    } else {
                        this._dom = document.createElement(tag || "nx-element");
                    }
                    this.notify("dom");
                    // handle the view
                    this.initView();
                }
                // fire ready event
                this.fire("ready");
            },
            initView: function() {
                var instance = this;
                var clazz = instance.constructor;
                // get views' definitions of the whole inheritance
                var view, views = [];
                do {
                    view = clazz.__meta__.view;
                    if (view) {
                        // TODO validate structure configuration
                        views.unshift(view);
                    }
                    clazz = clazz.__super__;
                } while (clazz && clazz !== nx.ui.Element);
                // initialize the element in order
                nx.each(views, function(view) {
                    instance.retain(instance.hierarchicalUpdate(view, instance));
                });
            },
            append: function(child) {
                // TODO to be decided: use append or appendChildren
                return this.hierarchicalAppend(child, this);
            },
            appendTo: function(parent) {
                if (nx.is(parent, EXPORT)) {
                    return parent.append(this);
                }
                var dom = this.dom();
                if (!parent || parent === global || parent === document) {
                    parent = document.body;
                }
                // attach the the parent
                if (parent instanceof Element) {
                    this.parent(parent);
                    parent.appendChild(dom);
                    return {
                        release: function() {
                            this.parent(null);
                            parent.removeChild(dom);
                        }.bind(this)
                    };
                }
            },
            hasAttribute: function(name) {
                return this._dom.hasAttribute(name);
            },
            hasAttributeNS: function(xmlns, name) {
                return this._dom.hasAttributeNS(xmlns, name);
            },
            getAttribute: function(name) {
                return this._dom.getAttribute(name);
            },
            getAttributeNS: function(xmlns, name) {
                return this._dom.getAttributeNS(xmlns, name);
            },
            setAttribute: function(name, value) {
                return this._dom.setAttribute(name, value);
            },
            setAttributeNS: function(xmlns, name, value) {
                return this._dom.setAttributeNS(xmlns, name, value);
            },
            removeAttribute: function(name) {
                return this._dom.removeAttribute(name);
            },
            removeAttributeNS: function(xmlns, name) {
                return this._dom.removeAttributeNS(xmlns, name);
            },
            hasClass: function(name) {
                return cssclass.has(this._dom, name);
            },
            addClass: function(name) {
                return cssclass.add(this._dom, name);
            },
            removeClass: function(name) {
                return cssclass.remove(this._dom, name);
            },
            toggleClass: function(name, existance) {
                if (arguments.length > 1) {
                    return cssclass.toggle(this._dom, name, existance);
                } else {
                    return cssclass.toggle(this._dom, name);
                }
            },
            getComputedStyle: function(name) {
                // TODO browser prefix?
                return this._dom.getComputedStyle(name);
            },
            hasStyle: function(name) {
                // FIXME not good implementation
                return this._dom.style.cssText.indexOf(name + ":") >= 0;
            },
            getStyle: function(name) {
                return cssstyle.get(this._dom, name);
            },
            setStyle: function(name, value) {
                return cssstyle.set(this._dom, name, value);
            },
            removeStyle: function(name) {
                return cssstyle.remove(this._dom, name);
            },
            getBound: function() {
                return cssstyle.getBound(this._dom);
            },
            _sync_dom_events: function(dom) {
                var self = this;
                var supported = nx.util.event.supported(dom);
                var resources = new nx.Object();
                nx.each(supported, function(ename) {
                    var callback = function(evt) {
                        self.fire(ename, evt);
                    };
                    resources.retain(this.on("+" + ename, function() {
                        dom.addEventListener(ename, callback);
                    }));
                    resources.retain(this.on("-" + ename, function() {
                        dom.removeEventListener(ename, callback);
                    }));
                }, this);
                nx.each(supported, function(ename) {
                    var callback = function(evt) {
                        self.fire(":" + ename, evt);
                    };
                    resources.retain(this.on("+:" + ename, function() {
                        dom.addEventListener(ename, callback, true);
                    }));
                    resources.retain(this.on("-:" + ename, function() {
                        dom.removeEventListener(ename, callback, true);
                    }));
                }, this);
                return resources;
            },
            _sync_child_list: function(list) {
                // sync with the new child list
                return list.monitorDiff(function(evt) {
                    // TODO async for possible movings
                    var i, j, diff, diffs = evt.diffs;
                    var drop, drops = evt.drops;
                    var sibling, join, joins = evt.joins;
                    var node, dom, pdom = this._dom;
                    for (i = 0; i < diffs.length; i++) {
                        diff = diffs[i], drop = drops[i], join = joins[i];
                        switch (diff[0]) {
                            case "splice":
                                // remove if droping
                                for (j = 0; j < drop.length; j++) {
                                    node = drop[j];
                                    if (!node) {
                                        continue;
                                    }
                                    dom = (node instanceof Node) ? node : node._dom;
                                    if (dom instanceof Node) {
                                        pdom.removeChild(dom);
                                    }
                                }
                                // add if joining
                                sibling = pdom.childNodes[diff[1]];
                                for (j = 0; j < join.length; j++) {
                                    // get the DOM node to insert
                                    node = join[j];
                                    if (!node) {
                                        continue;
                                    }
                                    dom = (node instanceof Node) ? node : node._dom;
                                    // apply insert
                                    if (dom instanceof Node) {
                                        sibling ? pdom.insertBefore(dom, sibling) : pdom.appendChild(dom);
                                    }
                                }
                                break;
                            case "move":
                                if (diff[3] > 0) {
                                    // move forward
                                    sibling = pdom.childNodes[diff[1] + diff[2] + diff[3]];
                                    for (j = diff[2] - 1; j >= 0; j--) {
                                        dom = pdom.childNodes[diff[1] + j];
                                        sibling ? pdom.insertBefore(dom, sibling) : pdom.appendChild(dom);
                                        sibling = dom;
                                    }
                                } else {
                                    sibling = pdom.childNodes[diff[1] + diff[3]] || pdom.firstChild;
                                    for (j = diff[2] - 1; j >= 0; j--) {
                                        dom = pdom.childNodes[diff[1] + j];
                                        sibling ? pdom.insertBefore(dom, sibling) : pdom.appendChild(dom);
                                        sibling = dom;
                                    }
                                }
                                break;
                        }
                    }
                }, this);
            },
            hierarchicalAppend: function(meta, context, list) {
                if (meta instanceof Node) {
                    return this.hierarchicalAppendChildren([meta], context, list);
                }
                return this.inherited(meta, context, list);
            },
            hierarchicalAppendString: function(meta, context, list) {
                var resources = this.inherited(meta, context, list);
                if (resources === nx.Object.IDLE_RESOURCE) {
                    return this.hierarchicalAppendHtml(meta, context, list);
                }
                return resources;
            },
            hierarchicalAppendNumber: function(meta, context, list) {
                return this.hierarchicalAppendHtml(meta, context, list);
            },
            hierarchicalAppendHtml: function(html, context, list) {
                var self = this;
                context = context || self;
                // FIXME create element for HTML, etc.
                var container = document.createElement("div");
                container.innerHTML = html;
                var children = Array.prototype.slice.call(container.childNodes);
                return self.hierarchicalAppendChildren(children, context, list);
            },
            hierarchicalUpdateEvent: function(name, handler, context) {
                // preprocess capture
                if (name === "capture") {
                    return this.hierarchicalUpdateCapture(handler, context);
                }
                return this.inherited(name, handler, context);
            },
            hierarchicalUpdateCapture: function(meta, context) {
                var self = this;
                var resources = new nx.Object();
                // preprocess meta
                meta = Hierarchical.getBindingIfString(meta) || meta;
                // bind or listen on event
                if (nx.is(meta, nx.binding)) {
                    resources.retain(nx.Object.binding(context, meta, function(pvalue) {
                        resources.release("recursive");
                        resources.retain("recursive", self.hierarchicalUpdateCapture(pvalue, context));
                    }));
                } else if (nx.is(meta, nx.Object)) {
                    resources.retain(this.hierarchicalUpdateCaptureObject(meta, context));
                } else {
                    var starter, events = [];
                    nx.each(meta, function(handler, name) {
                        if (name === "start") {
                            starter = handler;
                        } else {
                            events.push(name);
                            name = name.split(" ").map(function(name) {
                                return "capture" + name;
                            }).join(" ");
                            resources.retain(self.hierarchicalUpdateEvent(name, handler, context));
                        }
                    });
                    if (events.length) {
                        events = events.join(" ").split(" ");
                        resources.retain(self.hierarchicalUpdateEvent("mousedown touchstart", function(sender, evt) {
                            evt.capture(sender, events);
                            if (starter) {
                                if (typeof starter === "string") {
                                    // FIXME how about binding
                                    while (starter.charAt(0) === "{" && starter.charAt(starter.length - 1) === "}") {
                                        starter = starter.substring(1, starter.length - 1);
                                    }
                                    nx.path(context, starter).call(context, sender, evt);
                                } else {
                                    starter.call(context, sender, evt);
                                }
                            }
                        }, context));
                    }
                }
                return resources;
            },
            hierarchicalUpdateCaptureObject: function(meta, context) {
                var self = this;
                var resources = new nx.Object();
                var captures = new nx.List();
                nx.each(EXPORT.CAPTURES, function(name) {
                    var handler = meta[name];
                    if (!handler || typeof handler !== "function") {
                        return;
                    }
                    if (handler.__type__ === "property") {
                        resources.retain(name + "-watch", meta.watch(name, function(name, handler) {
                            if (typeof handler === "function") {
                                resources.retain(name, self.hierarchicalUpdateEvent("capture" + name, handler.bind(meta), context));
                                captures.toggle(name, true);
                            } else {
                                resources.release(name);
                                captures.toggle(name, false);
                            }
                        }));
                    } else {
                        resources.retain(name, self.hierarchicalUpdateEvent("capture" + name, handler.bind(meta), context));
                        captures.toggle(name, true);
                    }
                });
                resources.retain(captures.watch("length", function(pname, length) {
                    if (length) {
                        resources.retain("start", self.hierarchicalUpdateEvent("mousedown touchstart", function(sender, evt) {
                            evt.capture(sender, captures.toArray());
                            var starter = nx.path(meta, "start");
                            starter && starter.call(context, sender, evt);
                        }, context));
                    } else {
                        resources.release("start");
                    }
                }));
                return resources;
            },
            hierarchicalUpdateAttributes: function(meta, context) {
                var self = this;
                var resources = new nx.Object();
                // set attributes and properties of "child"
                nx.each(meta, function(value, key) {
                    if (key === "class") {
                        resources.retain(self.hierarchicalUpdateClass(value, context));
                    } else if (key === "style") {
                        resources.retain(self.hierarchicalUpdateStyles(value, context));
                    } else {
                        resources.retain(self.hierarchicalUpdateAttribute(key, value, context));
                    }
                });
                return resources;
            },
            hierarchicalUpdateAttribute: function(key, value, context) {
                var self = this;
                context = context || self;
                // parse "{xxx}"
                value = Hierarchical.getBindingIfString(value) || value;
                if (nx.is(value, nx.binding)) {
                    var resources = new nx.Object();
                    resources.retain(nx.Object.binding(context, value, function(pvalue) {
                        resources.release("recursive");
                        resources.retain("recursive", self.hierarchicalUpdateAttribute(key, pvalue, context));
                    }));
                    return resources;
                } else {
                    if (value || value === 0 || value === "") {
                        self.setAttribute(key, value);
                    } else {
                        self.removeAttribute(key);
                    }
                    return nx.Object.IDLE_RESOURCE;
                }
            },
            hierarchicalUpdateClass: function(value, context) {
                var self = this;
                context = context || self;
                // FIXME for deep recursive, return release instead of update resource manager
                if (nx.is(value, nx.binding)) {
                    return self.hierarchicalUpdateClassBinding(value, context);
                } else {
                    var resources = new nx.Object();
                    if (nx.is(value, "String")) {
                        nx.each(value.split(" "), function(value) {
                            var binding = Hierarchical.getStringBindingByString(value);
                            if (binding) {
                                resources.retain(self.hierarchicalUpdateClassBinding(binding, context));
                            } else {
                                resources.retain(self.hierarchicalUpdateClassValue(value, context));
                            }
                        });
                    } else if (nx.is(value, "Array")) {
                        nx.each(value, function(value) {
                            resources.retain(self.hierarchicalUpdateClass(value, context));
                        });
                    }
                    return resources;
                }
            },
            hierarchicalUpdateClassValue: function(value, context) {
                var self = this;
                context = context || self;
                value && self.addClass(value);
                return {
                    release: function() {
                        value && self.removeClass(value);
                        value = null;
                    }
                };
            },
            hierarchicalUpdateClassBinding: function(value, context) {
                var self = this;
                context = context || self;
                var dom = self.dom();
                var resources = new nx.Object();;
                resources.retain(nx.Object.binding(context, value, function(pvalue) {
                    resources.release("recursive");
                    pvalue && resources.retain("recursive", self.hierarchicalUpdateClass(pvalue, context));
                }));
                return resources;
            },
            hierarchicalUpdateStyles: function(value, context) {
                var self = this;
                // parse "{xxx}"
                value = Hierarchical.getBindingIfString(value) || value;
                var resources;
                if (nx.is(value, nx.binding)) {
                    // as binding
                    resources = new nx.Object();
                    resources.retain(nx.Object.binding(context, value, function(pvalue) {
                        resources.release("recursive");
                        pvalue && resources.retain("recursive", self.hierarchicalUpdateStyles(pvalue, context));
                    }));
                } else if (typeof value === "string") {
                    // TODO plain css text
                    resources = nx.Object.IDLE_RESOURCE;
                } else {
                    resources = new nx.Object();
                    nx.each(value, function(value, key) {
                        resources.retain(self.hierarchicalUpdateStyle(key, value, context));
                    });
                }
                return resources;
            },
            hierarchicalUpdateStyle: function(key, value, context) {
                var self = this;
                context = context || self;
                // parse "{xxx}"
                value = Hierarchical.getBindingIfString(value) || value;
                // apply binding or value
                if (nx.is(value, nx.binding)) {
                    return self.hierarchicalUpdateStyleBinding(key, value, context);
                } else {
                    return self.hierarchicalUpdateStyleValue(key, value, context);
                }
            },
            hierarchicalUpdateStyleValue: function(key, value, context) {
                var self = this;
                context = context || self;
                var lastvalue = self.hasStyle(key) ? self.getStyle(key) : null;
                self.setStyle(key, value);
                return {
                    release: function() {
                        if (lastvalue) {
                            self.setStyle(key, lastvalue);
                        } else {
                            self.removeStyle(key);
                        }
                    }
                };
            },
            hierarchicalUpdateStyleBinding: function(key, value, context) {
                var self = this;
                context = context || self;
                var resources = new nx.Object();
                resources.retain(nx.Object.binding(context, value, function(pvalue) {
                    resources.release("recursive");
                    resources.retain("recursive", self.hierarchicalUpdateStyle(key, pvalue, context));
                }));
                return resources;
            }
        },
        statics: {
            CAPTURES: ["tap", "dragstart", "drag", "dragend", "transform", "hold", "end"],
            CSS: nx.util.csssheet.create({
                "nx-element": {
                    "display": "block"
                }
            })
        }
    });
})(nx);
