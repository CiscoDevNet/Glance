(function (nx) {
    var EXPORT = nx.define("devme.manage.editor.Toolbar", nx.ui.Element, {
        view: {
            cssclass: "glance-editor-toolbar",
            content: [{
                cssclass: "section collapsible collapsed",
                content: [{
                    cssclass: ["switcher", nx.binding("model.backgroundVisible", function (visible) {
                        return !visible && "off";
                    })],
                    capture: {
                        tap: function () {
                            if (this.model()) {
                                this.model().backgroundVisible(!this.model().backgroundVisible());
                            }
                        }
                    }
                }, {
                    cssclass: "title",
                    content: "Background",
                    capture: {
                        tap: function (sender, evt) {
                            sender.parent().toggleClass("collapsed");
                        }
                    }
                }, {
                    cssclass: "body"
                }]
            }, {
                cssclass: "section",
                content: [{
                    cssclass: "title",
                    content: "Tool set"
                }, {
                    cssclass: "pane",
                    content: {
                        repeat: ["region", "wall", "door", "area", "legend", "text"],
                        cssclass: [
                            "tool",
                            nx.binding("scope.context.model.activeAction.type, scope.model", function (type, t) {
                                return type === t && "active";
                            })
                        ],
                        content: {
                            type: "glance.common.Icon",
                            properties: {
                                shape: "{scope.model}"
                            },
                            capture: {
                                tap: function () {
                                    var model = this.scope().context().model();
                                    var type = this.scope().model();
                                    if (model) {
                                        var action = new devme.manage.editor.model.ActionModel();
                                        action.type(type);
                                        model.activeAction(action);
                                    }
                                }
                            }
                        }
                    }
                }]
            }, {
                cssclass: "section",
                content: [{
                    cssclass: "switcher"
                }, {
                    cssclass: "title",
                    content: "Legend"
                }, {
                    // TODO
                }]
            }]
        },
        properties: {
            model: null
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-editor-toolbar": {
                    "background": "#e8e8e8",
                    "color": "black"
                },
                ".glance-editor-toolbar > .section": {
                    "font-size": ".8em",
                    "padding": ".5em",
                    "position": "relative",
                    "display": "block"
                },
                ".glance-editor-toolbar > .section:not(:last-child)": {
                    "border-bottom": "1px solid #b3b3b3"
                },
                ".glance-editor-toolbar > .section > .title": {
                    "display": "block"
                },
                ".glance-editor-toolbar > .section > .switcher": {
                    "display": "block",
                    "float": "right"
                },
                ".glance-editor-toolbar > .section > .switcher:before": {
                    "content": "\\f06e",
                    "font-family": "FontAwesome"
                },
                ".glance-editor-toolbar > .section > .switcher.off:before": {
                    "content": "\\f070"
                },
                ".glance-editor-toolbar > .section > .pane": {
                    "display": "flex",
                    "flex-wrap": "wrap",
                    "justify-content": "space-between",
                    "padding-top": ".5em"
                },
                ".glance-editor-toolbar > .section > .pane > .tool": {
                    "width": "1.6em",
                    "height": "1.6em",
                    "line-height": "1.4em",
                    "text-align": "center",
                    "border-radius": "0.2em"
                },
                ".glance-editor-toolbar > .section > .pane > .tool:hover": {
                    "background": "#00bab0"
                },
                ".glance-editor-toolbar > .section > .pane > .tool.active": {
                    "background": "#00bab0"
                },
                ".glance-editor-toolbar > .section > .pane > .tool > img": {
                    "display": "inline-block",
                    "vertical-align": "middle",
                    "width": "1.1em"
                }
            })
        }
    });
})(nx);
