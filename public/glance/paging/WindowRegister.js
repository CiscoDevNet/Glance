(function(nx) {
    var EXPORT = nx.define("glance.paging.WindowRegister", glance.paging.Window, {
        view: {
            cssclass: "app-register",
            extend: {
                pages: {
                    content: [{
                        type: "glance.paging.PageCheckin",
                        properties: {
                            service: "{self}",
                            nameReadonly: false
                        },
                        events: {
                            checkin: "onCheckin",
                            cancel: "onClose",
                        }
                    }, {
                        type: "glance.paging.PageCheckout",
                        properties: {
                            service: "{self}",
                            closeText: "Return to GLANCE"
                        },
                        events: {
                            checkout: "onCheckout",
                            close: "onClose"
                        }
                    }]
                },
                header: {
                    properties: {
                        text: "Visitor Registration"
                    }
                }
            }
        },
        properties: {
            whoami: null,
            selected: nx.binding("whoami"),
            registered: function() {
                return new nx.List();
            },
            service: function() {
                var service = new glance.service.Service();
                service.retain(service.on("message", function(sender, data) {
                    var model;
                    if (data.whoami) {
                        item = data.whoami;
                        model = this.getRegisteredClient(item);
                        model.online(true);
                        this.whoami(model);
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
            onCheckin: function(sender) {
                this.header().withLoadingTransition(function(complete) {
                    $.ajax({
                        method: "POST",
                        url: glance.service.api.getCheckUrl(this.whoami()),
                        data: {
                            name: this.whoami().name()
                        },
                        success: function() {
                            this.whoami().category("guest");
                            complete();
                        }.bind(this),
                        error: function() {
                            // TODO report an check-in error
                            if (nx.path(nx.global, "nx.util.url.search.DEMO")) {
                                this.whoami().category("guest");
                            }
                            complete();
                        }.bind(this)
                    });
                }.bind(this));
            },
            onCheckout: function(sender) {
                // TODO on fail
                this.header().withLoadingTransition(function(complete) {
                    $.ajax({
                        method: "DELETE",
                        url: glance.service.api.getCheckUrl(this.whoami()),
                        success: function() {
                            this.whoami().category("visitor");
                            complete();
                        }.bind(this),
                        error: function() {
                            // TODO report an check-out error
                            if (nx.path(nx.global, "nx.util.url.search.DEMO")) {
                                this.whoami().category("visitor");
                            }
                            complete();
                        }.bind(this)
                    });
                }.bind(this));
            },
            onClose: function(sender) {
                var map = nx.util.hash.getHashMap();
                delete map["#"];
                if (nx.path(nx.global, "nx.util.url.search.DEMO")) {
                    glance.perspective.DEMO.whoami.name = this.whoami().name();
                    glance.perspective.DEMO.whoami.category = this.whoami().category();
                }
                nx.util.hash.setHashMap(map);
            }
        },
        statics: {
            PATH: "register",
            CSS: nx.util.csssheet.create({
                ".app-register > .glance-header": {
                    "position": "fixed",
                    "left": "0",
                    "top": "0",
                    "width": "100%",
                    "z-index": "10"
                },
                ".app-register > .glance-register-body": {
                    "padding-top": "5.5em",
                    "margin": "0 auto",
                    "max-width": "20em",
                    "z-index": "0"
                }
            })
        }
    });
})(nx);
