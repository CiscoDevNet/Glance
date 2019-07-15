(function(nx) {
    var EXPORT = nx.define("glance.editor.Editor", nx.ui.Element, {
        mixins: [glance.common.BoundMixin],
        view: {
            cssclass: "glance-editor mode-{model.mode}",
            capture: "{interactor.editor}",
            content: [{
                cssclass: "workspace",
                content: [{
                    cssclass: "workspace-background",
                    cssstyle: {
                        width: "{model.width}",
                        height: "{model.height}",
                        transform: "{model.matrixActual}",
                        "background-image": nx.binding("model.underlay", function(underlay) {
                            return underlay ? "url(" + underlay + ")" : "none";
                        })
                    }
                }, {
                    cssclass: "workspace-stage",
                    type: "glance.editor.MapStage",
                    properties: {
                        editor: "{self}"
                    }
                }]
            }, {
                type: "glance.editor.EditorToolbar",
                cssclass: "toolbar",
                properties: {
                    editor: "{self}"
                }
            }, {
                type: "glance.editor.EditorZoombar",
                cssclass: "zoombar",
                properties: {
                    editor: "{self}"
                }
            }]
        },
        properties: {
            model: null,
            interactor: function() {
                var manager = new glance.editor.interact.InteractManager(this);
                return manager.interactor();
            },
            _boundSync: nx.binding("model, bound", function(model, bound) {
                if (model && bound) {
                    model.cwidth(bound.width);
                    model.cheight(bound.height);
                }
            })
        },
        methods: {
            registerInteractorResponsor: function(condition, key, responsor) {
                return Object.binding(this, condition, function(met) {
                    if (met) {
                        nx.set(this.interactor(), key, responsor);
                    }
                });
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-editor": {
                    "position": "absolute",
                    "left": "0px",
                    "right": "0px",
                    "top": "0px",
                    "bottom": "0px"
                },
                ".glance-editor > .workspace > .workspace-background": {
                    "position": "absolute",
                    "left": "0px",
                    "right": "0px",
                    "top": "0px",
                    "bottom": "0px"
                },
                ".glance-editor > .workspace > .workspace-background": {
                    "background": "rgba(255,255,255,.4)",
                    "transform-origin": "0 0"
                },
                ".glance-editor > .toolbar": {
                    "display": "none",
                    "position": "absolute",
                    "left": "1em",
                    "width": "1em",
                    "top": "1em"
                }
            })
        }
    });
})(nx);
