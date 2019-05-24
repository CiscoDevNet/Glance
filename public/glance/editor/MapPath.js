(function(nx) {
    var EXPORT = nx.define("glance.editor.MapPath", nx.lib.svg.Node, {
        view: {
            cssclass: "entity path active-{model.active}",
            content: [{
                type: "nx.lib.svg.shape.Path",
                cssclass: "main",
                capture: "{editor.interactor.boundary}",
                attributes: {
                    d: "{model.def}",
                    "stroke-width": "{model.stroke.width}"
                },
                properties: {
                    model: "{model}"
                }
            }, {
                type: "nx.lib.svg.shape.Path",
                cssclass: "face",
                capture: "{editor.interactor.face}",
                attributes: {
                    d: "{model.def}"
                },
                properties: {
                    model: "{model}"
                }
            }, {
                repeat: "{model.segments}",
                content: nx.binding("scope.model", function(model) {
                    return {
                        type: EXPORT.getSegmentViewTypeByModel(model),
                        cssclass: "segment",
                        properties: {
                            editor: "{scope.context.editor}",
                            model: model
                        }
                    };
                })
            }]
        },
        properties: {
            editor: null,
            model: null
        },
        statics: {
            getSegmentViewTypeByModel: function(segment) {
                if (segment) {
                    return "glance.editor.MapPathSegment" + segment.operation();
                }
            }
        }
    });
})(nx);
