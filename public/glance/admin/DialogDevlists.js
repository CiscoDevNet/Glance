(function(nx) {
    var EXPORT = nx.define("glance.admin.DialogDevlists", glance.common.Dialog, {
        view: {
            cssclass: "glance-dialog-devlists",
            extend: {
                body: {
                    content: [{
                        cssclass: "selections",
                        content: {
                            repeat: "{options}",
                            cssclass: "item selected-{selected}",
                            properties: {
                                selected: nx.binding("scope.model, scope.context.selected.length", function(model, length) {
                                    var selected = nx.path(this, "scope.context.selected");
                                    if (selected && model) {
                                        return selected.contains(model);
                                    }
                                })
                            },
                            content: "{scope.model.name}",
                            capture: {
                                tap: function() {
                                    var selected = nx.path(this, "scope.context.selected");
                                    var model = nx.path(this, "scope.model");
                                    selected.toggle(model);
                                }
                            }
                        }
                    }, {
                        cssclass: "footer",
                        content: [{
                            cssclass: "button button-ok",
                            content: "OK",
                            capture: {
                                tap: function() {
                                    this.fire("close", this.selected());
                                }
                            }
                        }, {
                            cssclass: "button button-cancel",
                            content: "Cancel",
                            capture: {
                                tap: function() {
                                    this.fire("close", false);
                                }
                            }
                        }]
                    }]
                }
            }
        },
        properties: {
            options: null,
            selected: function() {
                return new nx.List();
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-dialog-devlists > .body": {
                    "padding": "1em",
                    "background": "white"
                },
                ".glance-dialog-devlists > .body > .header": {
                    "width": "100%",
                    "color": "white",
                    "height": "3em",
                    "box-sizing": "border-box",
                    "padding-left": "6em",
                    "padding-top": "1.5em",
                    "background": "linear-gradient(to right, #67bd71, #16aec6)"
                },
                ".glance-dialog-devlists > .body > .selections": {
                    "margin": "1em",
                    "border": "1px solid black",
                    "border-radius": ".5em",
                    "padding": "1em"
                },
                ".glance-dialog-devlists > .body > .selections > .item": {
                    "cursor": "default"
                },
                ".glance-dialog-devlists > .body > .selections > .item:before": {
                    "font-family": "FontAwesome",
                    "display": "inline-block",
                    "nx:size": "1em"
                },
                ".glance-dialog-devlists > .body > .selections > .item.selected-true:before": {
                    "content": "\\f046"
                },
                ".glance-dialog-devlists > .body > .selections > .item:not(.selected-true):before": {
                    "content": "\\f096"
                },
                ".glance-dialog-devlists > .body > .footer": {
                    "text-align": "right",
                    "nx:absolute": "auto 1em 1em auto"
                },
                ".glance-dialog-devlists > .body > .footer > .button": {
                    "position": "relative",
                    "display": "inline-block",
                    "margin": "0 1em",
                    "padding": ".2em",
                    "border": "1px solid #ccc",
                    "border-radius": ".2em",
                    "min-width": "4em",
                    "text-align": "center",
                    "overflow": "hidden"
                },
                ".glance-dialog-devlists > .body > .footer > .button:hover:before": {
                    "content": " ",
                    "nx:absolute": "0",
                    "background": "rgba(0,0,0,.2)"
                }
            })
        }
    });
})(nx);
