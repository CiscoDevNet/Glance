(function (nx) {
    var EXPORT = nx.define("nx.topology.view.Topology", nx.lib.svg.Svg, {
        view: {
            content: {
                name: "stage",
                attributes: {
                    class: "stage",
                    style: {
                        transform: nx.binding("matrixInitial.matrix, matrix.matrix", function (m0, m) {
                            return nx.lib.svg.AbstractNode.cssTransformMatrix(m0 && m && nx.geometry.Matrix.multiply(m0, m));
                        })
                    }
                },
                content: [{
                    repeat: nx.binding("model.entitiesTopLevel", function (entities) {
                        return nx.List.select(entities, function (entity) {
                            return nx.is(entity, nx.topology.model.Union);
                        });
                    }),
                    type: "nx.topology.view.Group",
                    properties: {
                        topology: "{scope.owner}",
                        model: "{scope.model}"
                    }
                }, {
                    repeat: "model.connections",
                    type: "nx.topology.view.Link",
                    properties: {
                        topology: "{scope.owner}",
                        model: "{scope.model}"
                    }
                }, {
                    repeat: nx.binding("model.entitiesTopLevel", function (entities) {
                        return nx.List.select(entities, function (entity) {
                            return !nx.is(entity, nx.topology.model.Union);
                        });
                    }),
                    type: "nx.topology.view.Node",
                    properties: {
                        topology: "{scope.owner}",
                        model: "{scope.model}"
                    }
                }]
            }
        },
        properties: {
            model: null,
            matrixInitial: new nx.geometry.Matrix(),
            matrix: new nx.geometry.Matrix(),
            nodeShapeType: "nx.topology.view.shape.DefaultNodeShape",
            groupShapeType: "nx.topology.view.shape.DefaultGroupShape",
            linkShapeType: "nx.topology.view.shape.DefaultLinkShape"
        },
        methods: {
            init: function (config) {
                this.inherited();
                this.model(new nx.topology.model.TopologyModel({
                    data: config.data,
                    mapping: config.mapping,
                    lists: config.lists
                }));
            }
        }
    });
})(nx);
