(function(nx) {

    var Item = nx.define("glance.admin.NavigatorPageServerItem", nx.ui.Element, {
        view: {
            cssclass: "item active-{active}",
            cssstyle: {
                paddingLeft: nx.binding("depth", function(depth) {
                    return "2em";
                    return ((depth || 0) * 1.2 + 1.2) + "em";
                })
            },
            properties: {
                active: nx.binding("model, model.admin.tab", function(model, tab) {
                    return tab === model;
                })
            },
            content: [{
                cssclass: "collapser",
                capture: {
                    tap: function(sender) {
                        this.toggleClass("collapsed");
                    }
                }
            }, "{model.name}", "&nbsp;", {
                cssclass: "button button-edit",
                capture: {
                    tap: function(sender) {
                        var old = nx.path(this, "model.name");
                        glance.common.DialogUtil.prompt("Input a new name:", old, function(text) {
                            if (text && text !== old) {
                                nx.path(this, "model.name", text);
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
                                var list = nx.path(this, "parent.scope.list");
                                var model = nx.path(this, "model");
                                list.remove(model);
                            }
                        }.bind(this));
                    }
                }
            }],
            capture: {
                tap: function() {
                    var model = nx.path(this, "model");
                    if (nx.is(model, glance.model.FloorModel)) {
                        var adminModel = model.admin();
                        if (!adminModel.tabs().contains(model)) {
                            adminModel.tabs().push(model);
                        }
                        adminModel.tab(model);
                    }
                }
            }
        },
        properties: {
            model: null
        }
    });

    var Forest = nx.define("glance.admin.NavigatorPageServerForest", nx.ui.Element, {
        view: {
            cssclass: "tree children-{children.length}",
            content: [{
                type: Item,
                properties: {
                    model: "{model}"
                }
            }, {
                cssclass: "collapser",
                capture: {
                    tap: function(sender) {
                        this.toggleClass("collapsed");
                    }
                }
            }, {
                existence: "{isAppendAvailable}",
                cssclass: "tree",
                content: [{
                    cssclass: "item",
                    content: "{childrenAppendLabel}"
                }, {
                    cssclass: "collapser append",
                    capture: {
                        tap: function(sender) {

                        }
                    }
                }]
            }]
        },
        properties: {
            model: null,
            childrenAppendLabel: "",
            isAppendAvailable: nx.binding("children, childrenAppendLabel", function(children, label) {
                return nx.is(children, nx.List) && label;
            })
        }
    });

    var EXPORT = nx.define("glance.admin.NavigatorPageServer", nx.ui.Element, {
        view: {
            cssclass: "glance-nav-page",
            content: [{
                repeat: "{model.servers}",
                cssclass: "tree children-{children.length}",
                properties: {
                    depth: 0,
                    children: "{scope.model.campuses}"
                },
                content: [{
                    type: Item,
                    properties: {
                        depth: "{depth}",
                        model: "{scope.model}"
                    }
                }, {
                    repeat: "{children}",
                    cssclass: "tree children-{children.length}",
                    properties: {
                        depth: nx.binding("scope.context.depth", function(depth) {
                            return depth + 1;
                        }),
                        children: "{scope.model.buildings}"
                    },
                    content: [{
                        type: Item,
                        properties: {
                            depth: "{depth}",
                            model: "{scope.model}"
                        }
                    }, {
                        repeat: "{children}",
                        cssclass: "tree children-{children.length}",
                        properties: {
                            depth: nx.binding("scope.context.depth", function(depth) {
                                return depth + 1;
                            }),
                            children: "{scope.model.floors}"
                        },
                        content: [{
                            type: Item,
                            properties: {
                                depth: "{depth}",
                                model: "{scope.model}"
                            }
                        }, {
                            repeat: "{children}",
                            cssclass: "tree children-{children.length}",
                            properties: {
                                depth: nx.binding("scope.context.depth", function(depth) {
                                    return depth + 1;
                                })
                            },
                            content: [{
                                type: Item,
                                properties: {
                                    depth: "{depth}",
                                    model: "{scope.model}"
                                }
                            }]
                        }]
                    }]
                }]
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
                ".glance-nav-page .tree": {
                    "position": "relative"
                },
                ".glance-nav-page > .tree > .item": {
                    "font-size": "1.25em",
                    "font-weight": "300",
                    "color": "#00bab0 !important",
                    "padding-left": ".8em !important"
                },
                ".glance-nav-page .item.collapsed ~ .tree": {
                    "display": "none"
                },
                ".glance-nav-page .item+.tree:before": {
                    "top": "0",
                    "min-height": ".7em"
                },
                ".glance-nav-page .tree > .item": {
                    "padding": ".15em 1.3em .15em 1.5em",
                    "color": "#b5c5d9",
                    "cursor": "default",
                    "overflow-x": "hidden",
                    "text-overflow": "ellipsis",
                    "text-indent": "-.5em"
                },
                ".glance-nav-page .tree > .item:hover": {
                    "background": "rgba(255,255,255,.3)"
                },
                ".glance-nav-page .tree > .item.active-true": {
                    "background": "#00bab0"
                },
                ".glance-nav-page .tree > .item > .button": {
                    "display": "none",
                    "margin-left": ".6em",
                    "color": "#333",
                    "line-height": ".5em"
                },
                ".glance-nav-page .tree > .item:hover > .button": {
                    "display": "inline-block"
                },
                ".glance-nav-page .tree > .item > .button:hover": {
                    "color": "#111"
                },
                ".glance-nav-page .tree > .item > .button:after": {
                    "font-family": "FontAwesome",
                    "display": "inline",
                    "font-size": ".7em"
                },
                ".glance-nav-page .tree > .item > .button-edit:after": {
                    "content": "\\f044"
                },
                ".glance-nav-page .tree > .item > .button-remove:after": {
                    "content": "\\f1f8"
                },
                ".glance-nav-page .tree > .item > .collapser": {
                    "position": "relative",
                    "display": "inline-block",
                    "nx:size": "1em",
                    "text-align": "center",
                    "color": "#777"
                },
                ".glance-nav-page .tree > .item > .collapser:hover": {
                    "color": "#333"
                },
                ".glance-nav-page .tree > .item > .collapser:after": {
                    "nx:absolute": "0",
                    "font-family": "FontAwesome",
                    // "content": "\\f0e8",
                    "font-size": "1.2em"
                },
                ".glance-nav-page .tree .tree > .item > .collapser:after": {
                    "content": "\\f0d7"
                },
                ".glance-nav-page .tree .tree > .item.collapsed > .collapser:after": {
                    "content": "\\f0da"
                },
                ".glance-nav-page .tree .tree .tree > .item > .collapser:after": {
                    "content": "\\f107"
                },
                ".glance-nav-page .tree .tree .tree > .item.collapsed > .collapser:after": {
                    "content": "\\f105"
                },
                ".glance-nav-page .tree .tree .tree .tree > .item > .collapser": {
                    "visibility": "hidden"
                },
                ".glance-nav-page .tree .tree .tree .tree > .item > .collapser:after": {
                    // 
                },
                ".glance-nav-page .tree > .item > .collapser.append:after": {
                    "content": "\\f067"
                },
                ".glance-nav-page .tree.children-0 > .item > .collapser:after": {
                    "display": "none"
                },
                ".glance-nav-page .tree.children-false > .item > .collapser:after": {
                    "display": "none"
                }
            })
        }
    });

})(nx);
