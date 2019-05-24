(function(nx) {
    var EXPORT = nx.define("glance.editor.MapPathSegment", nx.lib.svg.Node, {
        view: {
            cssclass: "segment",
            content: [{
                type: "nx.lib.svg.shape.Path",
                cssclass: "main",
                capture: "{editor.interactor.edge}",
                attributes: {
                    d: nx.binding("model.start.x, model.start.y, model.def", function(x, y, def) {
                        if (nx.is(x, Number) && nx.is(y, Number) && def) {
                            return ["M", x, y, def].join(" ");
                        }
                    })
                },
                properties: {
                    model: "{model}"
                }
            }]
        },
        properties: {
            editor: null,
            model: null
        }
    });
})(nx);
