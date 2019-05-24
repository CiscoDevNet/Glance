function TestGraphCreateAddVertexEdge(CLASS) {
    test("Create/Add vertex/edge", function () {
        var graph = new CLASS();
        var vertex1 = graph.createVertex({
            id: 0,
            name: "shanghai"
        });
        var vertex2 = graph.createVertex({
            id: 1,
            name: "beijing"
        });
        ok(vertex1 && vertex2 && nx.is(vertex1, nx.topology.model.Vertex) && nx.is(vertex2, nx.topology.model.Vertex) && vertex1 !== vertex2, "Vertex created");
        ok(graph.vertices().length() == 0, "Create vertex means not insert");
        ok(vertex1.id() === 0 && vertex2.id() === 1, "Vertex ID correct");
        // add to union
        graph.vertices().push(vertex1);
        graph.vertices().push(vertex2);
        ok(graph.vertices().length() == 2, "Vertex add to list");
        ok(graph.entitiesMap().get(0) === vertex1 && graph.entitiesMap().get(1) === vertex2, "Vertex add to map");
        graph.vertices().push(vertex1);
        ok(graph.vertices().length() == 2, "Vertex add to list ignore duplication");
        // check ID conflict
        var vertex3 = graph.createVertex({
            id: 1,
            name: "beijing"
        });
        ok(vertex3, "Create vertex success, ID conflict doesn't matter.");
        graph.vertices().push(vertex3);
        ok(graph.vertices().length() == 2, "Vertex add to list ignore ID conflict.");
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
        var edge3 = graph.createEdge({
            source: 100,
            target: 1,
            name: "unreachable"
        });
        ok(edge1 && edge2 && edge1 !== edge2, "Edge created");
        ok(graph.edges().length() == 0, "Create edge means not insert");
        ok(edge1.source() === vertex1 && edge1.target() === vertex2 && edge2.source() === vertex1 && edge2.target() === vertex2, "Edge source/target correct");
        ok(!edge3, "Bad edge data creates nothing");
        // add to list
        graph.edges().push(edge1, edge2);
        ok(graph.edges().length() == 2, "Edge add to list");
        ok(graph.edgeMap().get(edge1.id()) === edge1 && graph.edgeMap().get(edge2.id()) === edge2, "Edge add to map");
        graph.edges().push(edge1);
        ok(graph.edges().length() == 2, "Edge add to list ignore duplication");
    });
}
