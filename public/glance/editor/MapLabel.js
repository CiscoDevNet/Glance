(function(nx) {
    var EXPORT = nx.define("glance.editor.MapLabel", nx.lib.svg.Node, {
        view: {
            cssclass: "label",
            content: [{
                type: "nx.lib.svg.shape.Rectangle",
                cssclass: "label-background"
            }, {
                type: "nx.lib.svg.shape.Text",
                cssclass: "label-text",
                attributes: {
                    x: "{model.vertex.x}",
                    y: "{model.vertex.y}"
                },
                content: "{model.text}"
            }]
        },
        properties: {
            editor: null,
            model: null
        }
    });
})(nx);
