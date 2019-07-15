(function(nx) {
    var EXPORT = nx.define("glance.editor.EditorToolbar", nx.ui.Element, {
        view: {
            cssclass: "glance-editor-toolbar",
            content: [{
                repeat: "{tools}",
                cssclass: "tool tool-{scope.model} active-{active}",
                capture: {
                    tap: function() {
                        var editorModel = this.scope().context().editor().model();
                        var mode = this.scope().model();
                        if (mode !== editorModel.mode()) {
                            editorModel.active(null);
                            editorModel.mode(mode);
                        }
                    }
                },
                properties: {
                    active: nx.binding("scope.context.editor.model.mode, scope.model", function(mode, model) {
                        return model.indexOf(mode) >= 0;
                    })
                }
            }]
        },
        properties: {
            editor: null,
            tools: {
                value: ["idle", "walls", "barriers", "regions", "facilities"]
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-editor-toolbar": {
                    "font-size": ".8em"
                },
                ".glance-editor-toolbar > .tool": {
                    "width": "1em",
                    "height": "1em",
                    "text-align": "center",
                    "line-height": "1em",
                    "color": "#000",
                    "padding": ".3em"
                },
                ".glance-editor-toolbar > .tool.active-true": {
                    "background": "rgba(0,0,0,.4)",
                    "color": "#000"
                },
                ".glance-editor-toolbar > .tool:not(.active-true):hover": {
                    "background": "rgba(0,0,0,.3)"
                },
                ".glance-editor-toolbar > .tool:not(.active-true):active": {
                    "background": "rgba(0,0,0,.5)"
                },
                ".glance-editor-toolbar > .tool:before": {
                    "content": " ",
                    "display": "block",
                    "font-family": "FontAwesome"
                },
                ".glance-editor-toolbar > .tool.tool-idle:before": {
                    "content": "\\f245"
                },
                ".glance-editor-toolbar > .tool.tool-walls:before": {
                    "content": "\\f0c9"
                },
                ".glance-editor-toolbar > .tool.tool-barriers:before": {
                    "content": "\\f0c8"
                },
                ".glance-editor-toolbar > .tool.tool-regions:before": {
                    "content": "\\f006"
                },
                ".glance-editor-toolbar > .tool.tool-facilities:before": {
                    "content": "\\f08d"
                }
            })
        }
    });
})(nx);
