function TestCollapsibleGraphNew(CLASS) {
    test("new CollapsibleGraph()", function () {
        var graph = new CLASS();
        ok(graph.unions(), "Union List");
        ok(graph.entitiesVisible(), "Entity Visible List");
        ok(graph.connections(), "Connection List");
    });
}
