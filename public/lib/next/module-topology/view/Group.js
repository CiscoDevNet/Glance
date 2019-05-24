(function (nx) {
    var EXPORT = nx.define("nx.topology.view.Group", nx.lib.svg.Node, {
        view: {
            cssclass: "group",
            content: nx.binding("model.collapse", function (collapsed) {
                return collapsed ? "{content_collapsed}" : "{content_expanded}";
            }),
            extend: {
                content_collapsed: {
                    cssclass: "group-content-collapse",
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
                content_expanded: {
                    cssclass: "group-content-expand",
                    content: [nx.binding("topology.groupShapeType", function (type) {
                        return {
                            type: type,
                            properties: {
                                topology: "{topology}",
                                model: "{model}"
                            }
                        };
                    }), {
                        repeat: nx.binding("model.entities", function (entities) {
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
                        repeat: nx.binding("model.entities", function (entities) {
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
            }
        },
        properties: {
            topology: null,
            model: null
        }
    });
})(nx);
