(function(nx) {

    var EXPORT = nx.define("glance.admin.NavigatorPageDevice", nx.ui.Element, {
        view: {
            cssclass: "glance-nav-page",
            content: [{
                cssclass: "title",
                content: [{
                    cssclass: "text",
                    content: "DEVICE"
                }, {
                    cssclass: "button",
                    content: "+",
                    capture: {
                        tap: function() {
                            var list = nx.path(this, "model.devlists");
                            var item = new glance.model.DevlistModel();
                            list.push(item);
                            item.admin(this.model());
                            item.name("New List");
                        }
                    }
                }]
            }, {
                cssclass: "list",
                content: {
                    repeat: "{model.devlists}",
                    cssclass: "item active-{active}",
                    properties: {
                        active: nx.binding("scope.model, scope.model.admin.tab", function(model, tab) {
                            return tab === model;
                        })
                    },
                    content: ["{scope.model.name}", {
                        cssclass: "button button-edit",
                        capture: {
                            tap: function(sender) {
                                var old = nx.path(this, "scope.model.name");
                                glance.common.DialogUtil.prompt("Input a new name:", old, function(text) {
                                    if (text && text !== old) {
                                        nx.path(this, "scope.model.name", text);
                                        // TODO call API to rename
                                    }
                                }.bind(this));
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
                }
            }]
        },
        properties: {
            model: null
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-nav-page": {
                    "font-size": ".7em",
                    "line-height": "1.5em",
                    "color": "#000"
                },
                ".glance-nav-page > .title": {
                    "margin": "0 1em",
                    "color": "#30e2d5"
                },
                ".glance-nav-page > .title > .text": {
                    "display": "inline"
                },
                ".glance-nav-page > .title > .button": {
                    "float": "right",
                    "font-size": "1.2em",
                    "nx:size": "1em",
                    "line-height": "1em",
                    "text-align": "center",
                    "cursor": "pointer"
                },
                ".glance-nav-page > .title > .button:hover": {
                    "background": "rgba(255,255,255,.1)"
                },
                ".glance-nav-page > .list": {
                    "position": "relative"
                },
                ".glance-nav-page > .list > .item": {
                    "padding": ".15em 1.4em",
                    "color": "#b5c5d9",
                    "cursor": "default",
                    "overflow-x": "hidden",
                    "text-overflow": "ellipsis"
                },
                ".glance-nav-page > .list > .item:hover": {
                    "background": "rgba(255,255,255,.3)"
                },
                ".glance-nav-page > .list > .item.active-true": {
                    "background": "#00bab0"
                },
                ".glance-nav-page > .list > .item:before": {
                    "content": "\\f0f6",
                    "font-family": "FontAwesome",
                    "margin-right": ".4em"
                },
                ".glance-nav-page > .list > .item > .button": {
                    "display": "none"
                },
                ".glance-nav-page > .list > .item:hover > .button": {
                    "display": "inline-block",
                    "margin-left": ".2em",
                    "color": "#777",
                    "line-height": ".5em"
                },
                ".glance-nav-page > .list > .item > .button:hover": {
                    "color": "#333"
                },
                ".glance-nav-page > .list > .item > .button:after": {
                    "font-family": "FontAwesome",
                    "display": "inline",
                    "font-size": ".7em"
                },
                ".glance-nav-page > .list > .item > .button-edit:after": {
                    "content": "\\f044"
                },
                ".glance-nav-page > .list > .item > .button-remove:after": {
                    "content": "\\f1f8"
                }
            })
        }
    });

})(nx);
