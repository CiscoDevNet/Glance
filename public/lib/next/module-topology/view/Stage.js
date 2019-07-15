(function (nx) {
    var EXPORT = nx.define("nx.topology.view.Stage", nx.lib.svg.Node, {
        view: {
            cssstyle: {
                transform: nx.binding("matrix", nx.lib.svg.AbstractNode.cssTransformMatrix)
            }
        },
        properties: {
            matrix: nx.geometry.Matrix.I
        }
    });
})(nx);
