(function (nx) {
    var EXPORT = nx.define("nx.topology.view.Node", nx.lib.svg.Node, {
        view: {
            cssclass: "node",
            content: nx.binding("topology.nodeShapeType", function (type) {
                return {
                    type: type,
                    properties: {
                        topology: "{topology}",
                        model: "{model}"
                    }
                };
            })
        },
        properties: {
            topology: null,
            model: null
        }
    });
})(nx);
