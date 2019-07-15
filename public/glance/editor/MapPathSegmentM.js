(function(nx) {
    var EXPORT = nx.define("glance.editor.MapPathSegmentM", glance.editor.MapPathSegment, {
        view: {
            content: [{
                type: "nx.lib.svg.shape.Rectangle",
                cssclass: "vertex",
                capture: "{editor.interactor.vertex}",
                properties: {
                    model: "{model.end}",
                    x: "{model.end.x}",
                    y: "{model.end.y}",
                    center: true,
                    width: "{editor.model.scaledSizeOfVertex}",
                    height: "{editor.model.scaledSizeOfVertex}"
                }
            }]
        }
    });
})(nx);
