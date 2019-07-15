(function(nx) {
    var EXPORT = nx.define("glance.paging.WindowCheck", glance.paging.Window, {
        view: {
            cssclass: "app-check",
            extend: {
                pages: {
                    content: [{
                        name: "pageSearch",
                        type: "glance.paging.PageSearch",
                        properties: {
                            service: "{self}"
                        },
                        events: {
                            select: "onSelect"
                        }
                    }, {
                        name: "pageCheckin",
                        type: "glance.paging.PageCheckin",
                        properties: {
                            service: "{self}"
                        },
                        events: {
                            checkin: "onCheckin",
                            cancel: "onCancel"
                        }
                    }, {
                        name: "pageCheckout",
                        type: "glance.paging.PageCheckout",
                        properties: {
                            service: "{self}"
                        },
                        events: {
                            checkout: "onCheckout"
                        }
                    }]
                },
                header: {
                    properties: {
                        text: "Expert Check-in"
                    }
                }
            }
        },
        properties: {
            whoami: null,
            registered: function() {
                return new nx.List();
            },
            registeredMap: nx.binding("registered", true, function(async, registered) {
                if (registered) {
                    var map = new nx.Map();
                    map.retain(registered.monitorContaining(function(client) {
                        return client.watch("id", function(pname, id) {
                            map.set(id, client);
                            return {
                                release: function() {
                                    map.remove(id);
                                }
                            };
                        })
                    }));
                    async.set(map);
                    return map;
                }
            }),
            selected: nx.binding("registeredMap, global.nx.util.hash.map", true, function(async, registeredMap, map) {
                if (registeredMap && map) {
                    var resources = new nx.Object();
                    resources.retain(map.cascade("#", function(path) {
                        if (path.indexOf(EXPORT.PATH) === 0) {
                            var id = path.substring(EXPORT.PATH.length + 1);
                            if (id) {
                                resources.retain("cascade", registeredMap.cascade(id, function(client) {
                                    this.header().withLoadingTransition(function(complete) {
                                        async.set(client);
                                        complete();
                                    });
                                }.bind(this)));
                            } else {
                                resources.release("cascade");
                                this.header().withLoadingTransition(function(complete) {
                                    async.set(null);
                                    complete();
                                });
                            }
                        }
                    }.bind(this)));
                    return resources;
                }
            }),
            service: function() {
                var service = new glance.service.Service();
                service.retain(service.on("message", function(sender, data) {
                    var model;
                    if (data.register) {
                        // TODO
                        nx.each(data.register, function(item) {
                            this.getRegisteredClient(item);
                        }.bind(this));
                    }
                    if (data.whoami) {
                        item = data.whoami;
                        model = this.getRegisteredClient(item);
                        model.online(true);
                        if (model.category === "expert") {
                            this.whoami(model);
                            var map = nx.util.hash.getHashMap();
                            map["#"] = EXPORT.PATH + "/" + nx.path(model, "id");
                            nx.util.hash.setHashMap(map);
                        }
                    }
                    if (data.avatar && data.avatar.length) {
                        nx.each(data.avatar, function(id) {
                            var client = this.registered().find(function(client) {
                                return client.id() === id;
                            });
                            client && client.avatarVersion(Date.now());
                        }.bind(this));
                    }
                }.bind(this)));
                return service;
            }
        },
        methods: {
            init: function() {
                this.inherited();
                // check if demo
                var service = this.service();
                if (!nx.path(nx.global, "nx.util.url.search.DEMO")) {
                    service.autoconnect(true);
                } else {
                    glance.perspective.DEMO.run(this, service);
                }
            },
            getRegisteredClient: function(item, createIfMissing) {
                // update item
                item = nx.extend({}, item);
                // get registered
                var model = this.registered().find(function(model) {
                    return model.id() === item.id;
                });
                if (!model) {
                    if (createIfMissing !== false) {
                        // register the item
                        model = new glance.model.ClientModel(item);
                        this.registered().push(model);
                    }
                } else {
                    nx.sets(model, item);
                }
                return model;
            },
            onSelect: function(sender, client) {
                var map = nx.util.hash.getHashMap();
                map["#"] = EXPORT.PATH + "/" + nx.path(client, "id");
                nx.util.hash.setHashMap(map);
            },
            onCheckin: function(sender) {
                this.header().withLoadingTransition(function(complete) {
                    $.ajax({
                        method: "POST",
                        url: glance.service.api.getCheckUrl(this.selected()),
                        success: function() {
                            this.whoami(this.selected());
                            complete();
                        }.bind(this),
                        error: function() {
                            // TODO report an check-in error
                            if (nx.path(nx.global, "nx.util.url.search.DEMO")) {
                                var client = this.selected();
                                this.whoami(client);
                                var map = nx.util.hash.getHashMap();
                                map["#"] = EXPORT.PATH + "/" + nx.path(this, "whoami.id");
                                nx.util.hash.setHashMap(map);
                            }
                            complete();
                        }.bind(this)
                    });
                }.bind(this));
            },
            onCancel: function(sender) {
                var map = nx.util.hash.getHashMap();
                map["#"] = EXPORT.PATH;
                nx.util.hash.setHashMap(map);
            },
            onCheckout: function(sender) {
                // TODO on fail
                this.header().withLoadingTransition(function(complete) {
                    $.ajax({
                        method: "DELETE",
                        url: glance.service.api.getCheckUrl(this.selected()),
                        success: function() {
                            var map = nx.util.hash.getHashMap();
                            map["#"] = EXPORT.PATH + "/" + nx.path(this, "whoami.id");
                            nx.util.hash.setHashMap(map);
                            this.whoami(null);
                            complete();
                        }.bind(this),
                        error: function() {
                            if (nx.path(nx.global, "nx.util.url.search.DEMO")) {
                                // TODO report an check-out error
                                var map = nx.util.hash.getHashMap();
                                map["#"] = EXPORT.PATH + "/" + nx.path(this, "whoami.id");
                                nx.util.hash.setHashMap(map);
                                this.whoami(null);
                            }
                            complete();
                        }.bind(this)
                    });
                }.bind(this));
            }
        },
        statics: {
            PATH: "check"
        }
    });
})(nx);
