function TestGraphRemoveVertexEdge(CLASS) {
    test("Remove vertex/edge", function () {
        var graph = new CLASS();
        var vertex1 = graph.createVertex({
            id: 0,
            name: "shanghai"
        });
        var vertex2 = graph.createVertex({
            id: 1,
            name: "beijing"
        });
        graph.vertices().push(vertex1);
        graph.vertices().push(vertex2);
        // must make entities exist inside graph before creating related edges
        var edge1 = graph.createEdge({
            source: 0,
            target: 1,
            name: "airedge"
        });
        var edge2 = graph.createEdge({
            source: 0,
            target: 1,
            name: "train"
        });
        graph.edges().push(edge1, edge2);
        // start remove
        graph.edges().remove(edge1);
        ok(graph.edges().length() === 1, "Edges removed");
        ok(!graph.edgeMap().has(edge1.id()), "Edge map removed");
        graph.vertices().remove(vertex1);
        ok(graph.vertices().length() === 1, "Vertices removed");
        ok(!graph.entitiesMap().has(0), "Vertex map removed");
        ok(graph.edges().length() === 0, "Edges cascaded");
        ok(!graph.edgeMap().has(edge1.id()) && !graph.edgeMap().has(edge2.id()), "Edge map cascaded");
    });
}
