(function (nx) {
    var EXPORT = nx.define("nx.lib.svg.shape.PathGroup", nx.lib.svg.Node, {
        view: {
            content: nx.template({
                source: "data",
                pattern: {
                    type: "nx.lib.svg.shape.Path",
                    properties: {
                        d: nx.binding("scope.model.d"),
                        fill: nx.binding("scope.model.fill"),
                        stroke: nx.binding("scope.model.stroke")
                    }
                }
            })
        },
        properties: {
            data: {}
        }
    });
})(nx);
