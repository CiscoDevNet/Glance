(function(nx) {
    var EXPORT = nx.define("glance.editor.MapPathSegmentC", glance.editor.MapPathSegment, {
        view: {
            content: [{
                type: "nx.lib.svg.shape.Line",
                cssclass: "edge-control",
                attribute: {
                    x1: "{model.start.x}",
                    y1: "{model.start.y}",
                    x2: "{model.startControl.x}",
                    y2: "{model.startControl.y}"
                }
            }, {
                type: "nx.lib.svg.shape.Rectangle",
                cssclass: "vertex",
                capture: "{editor.interactor.vertex}",
                properties: {
                    model: "{model.start}",
                    x: "{model.start.x}",
                    y: "{model.start.y}",
                    center: true,
                    width: "{editor.model.scaledSizeOfVertex}",
                    height: "{editor.model.scaledSizeOfVertex}"
                }
            }, {
                type: "nx.lib.svg.shape.Rectangle",
                cssclass: "vertex-control",
                capture: "{editor.interactor.vertex}",
                properties: {
                    model: "{model.startControl}",
                    x: "{model.startControl.x}",
                    y: "{model.startControl.y}",
                    center: true,
                    width: "{editor.model.scaledSizeOfControlPoint}",
                    height: "{editor.model.scaledSizeOfControlPoint}"
                }
            }, {
                type: "nx.lib.svg.shape.Line",
                cssclass: "edge-control",
                attribute: {
                    x1: "{model.end.x}",
                    y1: "{model.end.y}",
                    x2: "{model.endControl.x}",
                    y2: "{model.endControl.y}"
                }
            }, {
                type: "nx.lib.svg.shape.Rectangle",
                cssclass: "vertex-control",
                capture: "{editor.interactor.vertex}",
                properties: {
                    model: "{model.endControl}",
                    x: "{model.endControl.x}",
                    y: "{model.endControl.y}",
                    center: true,
                    width: "{editor.model.scaledSizeOfControlPoint}",
                    height: "{editor.model.scaledSizeOfControlPoint}"
                }
            }, {
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
