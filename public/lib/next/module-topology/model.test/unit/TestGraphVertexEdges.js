function TestGraphVertexEdges(CLASS) {
    test("Vertex.edges", function () {
        var graph = new CLASS({
            vertices: [{
                id: 0,
                name: "shanghai"
            }, {
                id: 1,
                name: "beijing"
            }],
            edges: [{
                source: 0,
                target: 1,
                name: "airedge"
            }]
        });
        ok(graph.entitiesMap().get(0).edges().length() == 1, "Initial adding edge to source vertex success.");
        ok(graph.entitiesMap().get(1).edges().length() == 1, "Initial adding edge to target vertex success.");
        var edge = graph.createEdge({
            source: 0,
            target: 1,
            name: "train"
        });
        graph.edges().push(edge);
        ok(graph.entitiesMap().get(0).edges().length() == 2, "Adding edge to source vertex success.");
        ok(graph.entitiesMap().get(1).edges().length() == 2, "Adding edge to target vertex success.");
        graph.edges().remove(edge);
        ok(graph.entitiesMap().get(0).edges().length() == 1, "Removing edge to source vertex success.");
        ok(graph.entitiesMap().get(1).edges().length() == 1, "Removing edge to target vertex success.");
        graph.vertices().splice(0, 1);
        ok(graph.entitiesMap().get(1).edges().length() == 0, "Removing vertex will effect related entities.");
    });
}
