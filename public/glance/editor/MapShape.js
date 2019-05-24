(function(nx) {
    var EXPORT = nx.define("glance.editor.MapShape", nx.lib.svg.Node, {
        view: {
            cssclass: "entity shape active-{model.active}",
            content: [{
                type: "nx.lib.svg.shape.Path",
                cssclass: "main",
                capture: "{editor.interactor.boundary}",
                attributes: {
                    d: "{shape}"
                },
                properties: {
                    model: "{model}"
                }
            }, {
                type: "nx.lib.svg.shape.Path",
                cssclass: "face",
                capture: "{editor.interactor.face}",
                attributes: {
                    d: "{shape}"
                },
                properties: {
                    model: "{model}"
                }
            }, {
                repeat: "{model.edges}",
                type: "nx.lib.svg.shape.Line",
                cssclass: "edge",
                capture: "{scope.context.editor.interactor.edge}",
                attributes: {
                    x1: "{scope.model.vertex0.x}",
                    y1: "{scope.model.vertex0.y}",
                    x2: "{scope.model.vertex1.x}",
                    y2: "{scope.model.vertex1.y}"
                },
                properties: {
                    model: "{scope.model}"
                }
            }, {
                repeat: "{model.vertices}",
                type: "nx.lib.svg.shape.Circle",
                cssclass: "vertex",
                capture: "{scope.context.editor.interactor.vertex}",
                attributes: {
                    r: 2,
                    cx: "{scope.model.x}",
                    cy: "{scope.model.y}"
                },
                properties: {
                    model: "{scope.model}"
                }
            }]
        },
        properties: {
            editor: null,
            model: null,
            shape: nx.binding("model.vertices", true, function(async, vertices) {
                if (vertices) {
                    var mapping = nx.List.mapping(vertices, "x,y", function(x, y) {
                        return x + "," + y;
                    });
                    mapping.retain(mapping.monitorDiff(function(evt) {
                        async.set("M" + mapping.data().join("L") + "Z");
                    }));
                    return mapping;
                }
            })
        }
    });
})(nx);
