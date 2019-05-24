function TestGraphAddWrongVertexEdge(CLASS) {
    test("Add wrong vertex/edge", function () {
        var graph = new CLASS();
        graph.vertices().push(1);
        ok(graph.vertices().length() === 0, "Adding wrong vertex denied.");
        graph.edges().push(2);
        ok(graph.edges().length() === 0, "Adding wrong edge denied.");
    });
}
