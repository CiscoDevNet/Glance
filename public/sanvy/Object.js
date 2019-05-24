(function(nx) {
    var EXPORT = nx.define("sanvy.Object", nx.Hierarchical, {
        hierarchical: {
            three: function(meta, context) {
                return this.hierarchicalUpdateThree(meta, context);
            }
        },
        properties: {
            stage: nx.binding("parent.stage", true, function(async, parentStage) {
                parentStage && async.set(parentStage);
            }),
            object: {
                watcher: function(pname, pvalue) {
                    this.release("objectReference");
                    if (pvalue instanceof THREE.Object3D) {
                        pvalue.sanvy = this;
                        this.retain("objectReference", {
                            release: function() {
                                delete pvalue.sanvy;
                            }
                        });
                    }
                }
            },
            childDefaultType: "sanvy.Object",
            childObjects: {
                dependencies: "object, childList",
                async: true,
                value: function(async, object, childList) {
                    if (object && childList) {
                        // TODO child objects, remove?
                        var childUpdated = nx.List.mapping(childList, "self", true, function(async, child) {
                            var resources;
                            // TODO THREE original objects
                            if (nx.is(child, sanvy.Object)) {
                                resources = new nx.Object();
                                resources.retain(nx.Object.cascade(child, "object", function(childObject) {
                                    resources.release("childObjects");
                                    if (childObject) {
                                        object.add(childObject);
                                        async.set(child);
                                        resources.retain("childObjects", {
                                            release: function() {
                                                object.remove(childObject);
                                            }
                                        });
                                    }
                                }));
                                return resources;
                            }
                        });
                        var childObjects = nx.List.select(childUpdated, "self");
                        childObjects.retain(childUpdated);
                        // return result
                        async.set(childObjects);
                        return childObjects;
                    }
                }
            }
        },
        methods: {
            init: function(object3d) {
                this.inherited();
                if (!(object3d instanceof THREE.Object3D)) {
                    object3d = new THREE.Object3D();
                }
                this.object(object3d);
                this.initSanvy();
            },
            initSanvy: function() {
                var instance = this;
                var clazz = instance.constructor;
                // get sanvys' definitions of the whole inheritance
                var sanvy, sanvys = [];
                do {
                    sanvy = clazz.__meta__.sanvy;
                    if (sanvy) {
                        // TODO validate structure configuration
                        sanvys.unshift(sanvy);
                    }
                    clazz = clazz.__super__;
                } while (clazz && clazz !== nx.ui.Element);
                // initialize the element in order
                nx.each(sanvys, function(sanvy) {
                    instance.retain(instance.hierarchicalUpdate(sanvy, instance));
                });
            },
            hierarchicalUpdateThree: function(meta, context) {
                var self = this;
                var resources = new nx.Object();
                // preprocess meta
                meta = Hierarchical.getBindingIfString(meta) || meta;
                // bind or listen on event
                if (nx.is(meta, nx.binding)) {
                    resources.retain(nx.Object.binding(context, meta, function(pvalue) {
                        resources.release("recursive");
                        resources.retain("recursive", self.hierarchicalUpdateThree(pvalue, context));
                    }));
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
            hierarchicalAppendChildren: function(children, context, list) {
                var resources = new nx.Object();
                resources.retain(this.inherited(children, context, list))
                this.stage() && this.stage().dirty(true);
                resources.retain({
                    release: function() {
                        this.stage() && this.stage().dirty(true);
                    }.bind(this)
                });
                return resources;
            },
            hierarchicalUpdatePropertyValue: function(key, value, context) {
                var resources = this.inherited(key, value, context);
                this.stage() && this.stage().dirty(true);
                return resources;
            }
        },
        statics: {
            toColorByRGB: function(r, g, b) {
                return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
            }
        }
    });
})(nx);
