(function(nx) {
    var EXPORT = nx.define("glance.editor.model.ShapeModel", {
        properties: {
            vertices: function() {
                return new nx.List();
            },
            edges: nx.binding("vertices", true, function(async, vertices) {
                if (vertices) {
                    var head = nx.List.slicing(vertices, 0, 1);
                    var circle = nx.List.concatenate([vertices, head]);
                    var edges = nx.List.tuple(circle, 2, "value, items", function(resources, value, items) {
                        if (!value) {
                            value = new glance.editor.model.EdgeModel();
                            resources.retain("edge", value);
                        }
                        value.vertex0(items[0]);
                        value.vertex1(items[1]);
                        return value;
                    });
                    edges.retain(head);
                    edges.retain(circle);
                    // set edges
                    async.set(edges);
                    return edges;
                }
            })
        }
    });
})(nx);
