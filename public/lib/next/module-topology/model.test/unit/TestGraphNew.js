function TestGraphNew(CLASS) {
    test("new Graph()", function () {
        var graph = new CLASS();
        ok(graph.vertices(), "Vertex List");
        ok(graph.edges(), "Edge List");
        ok(graph.entitiesMap(), "Vertex Map");
        ok(graph.edgeMap(), "Edge Map");
        ok(graph.statusDefinitionMap(), "Status Definition Map");
        ok(graph.statusListMap(), "Status List Map");
    });
}
