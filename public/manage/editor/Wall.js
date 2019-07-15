(function (nx) {
    var EXPORT = nx.define("devme.manage.editor.Wall", nx.lib.svg.shape.Line, {
        view: {
            cssstyle: {
                "stroke-width": "{model.width}"
            },
            properties: {
                x: nx.binding("model.start.x"),
                y: nx.binding("model.start.y"),
                dx: nx.binding("model.end.x, model.start.x", nx.math.minus),
                dy: nx.binding("model.end.y, model.start.y", nx.math.minus)
            }
        },
        properties: {
            model: null
        }
    });
})(nx);
