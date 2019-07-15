(function (nx) {
    var EXPORT = nx.define("devme.manage.editor.Point", nx.lib.svg.Node, {
        view: {
            cssclass: "glance-editor-point",
            content: [{
                type: "nx.lib.svg.shape.Rectangle",
                properties: {
                    x: "{model.x}",
                    y: "{model.y}",
                    center: true,
                    width: 1,
                    height: 1
                }
            }]
        },
        properties: {
            model: null
        }
    });
})(nx);
