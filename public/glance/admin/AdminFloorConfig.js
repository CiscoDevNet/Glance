(function(nx) {

    var EXPORT = nx.define("glance.admin.AdminFloorConfig", nx.ui.Element, {
        view: {
            cssclass: "glance-admin-floor-config",
            content: [{
                cssclass: "group",
                content: [{
                    cssclass: "title",
                    content: ["Location Server", {
                        cssclass: "button button-add",
                        capture: {
                            tap: function() {
                                var list = nx.path(this, "model.locationers");
                                var model = new glance.model.LocationerModel();
                                nx.sets(model, {
                                    type: "cmx",
                                    url: "",
                                    username: "admin",
                                    password: "",
                                    timezone: "Pacific Standard Time"
                                });
                                list.push(model);
                            }
                        }
                    }],
                    capture: {
                        tap: "{onGroupTitleTap}"
                    }
                }, {
                    repeat: "{model.locationers}",
                    type: "glance.admin.AdminFloorConfig.Locationer",
                    cssclass: "item",
                    properties: {
                        model: "{scope.model}"
                    }
                }]
            }, {
                cssclass: "group",
                content: [{
                    cssclass: "title",
                    content: ["Devices", {
                        cssclass: "button button-add",
                        capture: {
                            tap: function() {
                                var devlists = nx.path(this, "model.admin.devlists");
                                var list = new nx.List(nx.path(this, "model.devlists"));
                                var dialog = new glance.admin.DialogDevlists();
                                dialog.options(devlists);
                                dialog.selected(list);
                                dialog.on("close", function(sender, list) {
                                    if (list) {
                                        // TODO
                                        nx.path(this, "model.devlists", list);
                                    }
                                    dialog.release();
                                }.bind(this));
                                dialog.retain(dialog.appendTo());
                            }
                        }
                    }],
                    capture: {
                        tap: "{onGroupTitleTap}"
                    }
                }, {
                    repeat: "{model.devlists}",
                    cssclass: "item",
                    properties: {
                        active: nx.binding("scope.model, scope.model.admin.tab", function(model, tab) {
                            return tab === model;
                        })
                    },
                    content: ["{scope.model.name}", {
                        cssclass: "button button-remove",
                        capture: {
                            tap: function(sender) {
                                glance.common.DialogUtil.confirm("Are you sure to remove?", function(result) {
                                    if (result) {
                                        var list = nx.path(this, "scope.list");
                                        var model = nx.path(this, "scope.model");
                                        list.remove(model);
                                        // TODO call API to remove
                                    }
                                }.bind(this));
                            }
                        }
                    }],
                    capture: {
                        tap: function() {
                            var model = nx.path(this, "scope.model");
                            var adminModel = model.admin();
                            if (!adminModel.tabs().contains(model)) {
                                adminModel.tabs().push(model);
                            }
                            adminModel.tab(model);
                        }
                    }
                }]
            }]
        },
        properties: {
            model: null
        },
        methods: {
            onGroupTitleTap: function(sender) {
                sender.parent().toggleClass("collapsed-true");
            }
        },
        statics: {
            Locationer: nx.define(nx.ui.Element, {
                view: {
                    content: ["{model.name}", nx.binding("model.name, model.type", function(name, type) {
                        return !name && ("<placeholder>&lt;" + type + "&gt;</placeholder>");
                    }), {
                        cssclass: "button button-edit",
                        capture: {
                            tap: function(sender) {
                                var model = this.model();
                                var dialog = new glance.admin.DialogLocationer();
                                dialog.model(model);
                                dialog.on("close", function(sender, data) {
                                    nx.each(data, function(value, key) {
                                        nx.path(model, key, value);
                                    });
                                    dialog.release();
                                });
                                dialog.retain(dialog.appendTo());
                            }
                        }
                    }, {
                        cssclass: "button button-remove",
                        capture: {
                            tap: function(sender) {
                                glance.common.DialogUtil.confirm("Are you sure to remove?", function(result) {
                                    if (result) {
                                        var list = nx.path(this, "scope.list");
                                        var model = nx.path(this, "scope.model");
                                        list.remove(model);
                                        // TODO call API to remove
                                    }
                                }.bind(this));
                            }
                        }
                    }]
                }
            }),
            CSS: nx.util.csssheet.create({
                ".glance-admin-floor-config > .group": {
                    "padding": ".5em",
                    "overflow-y": "auto"
                },
                ".glance-admin-floor-config > .group:not(:first-child)": {
                    "border-top": "1px solid #ccc"
                },
                ".glance-admin-floor-config > .group > .title": {
                    "position": "relative",
                    "font-weight": "400",
                    "cursor": "default"
                },
                ".glance-admin-floor-config > .group.collapsed-true > .title:before": {
                    //
                },
                ".glance-admin-floor-config > .group.collapsed-true > :not(.title)": {
                    "display": "none"
                },
                ".glance-admin-floor-config > .group > .title > .button": {
                    "nx:absolute": "0 0 0 auto",
                    "nx:size": "1em auto"
                },
                ".glance-admin-floor-config > .group > .title > .button-add:before": {
                    "content": "\\f196",
                    "font-family": "FontAwesome"
                },
                ".glance-admin-floor-config > .group > .item": {
                    "padding": ".3em",
                    "cursor": "default"
                },
                ".glance-admin-floor-config > .group > .item > placeholder": {
                    "opacity": ".5"
                },
                ".glance-admin-floor-config > .group > .item.active-true": {
                    "background": "rgba(0,0,0,.1)"
                },
                ".glance-admin-floor-config > .group > .item > .button": {
                    "display": "none"
                },
                ".glance-admin-floor-config > .group > .item:hover > .button": {
                    "display": "inline-block",
                    "margin-left": ".2em",
                    "color": "#777",
                    "line-height": ".5em"
                },
                ".glance-admin-floor-config > .group > .item > .button:hover": {
                    "color": "#333"
                },
                ".glance-admin-floor-config > .group > .item > .button:after": {
                    "font-family": "FontAwesome",
                    "display": "inline",
                    "font-size": ".7em"
                },
                ".glance-admin-floor-config > .group > .item > .button-edit:after": {
                    "content": "\\f044"
                },
                ".glance-admin-floor-config > .group > .item > .button-remove:after": {
                    "content": "\\f1f8"
                }
            })
        }
    });

})(nx);
