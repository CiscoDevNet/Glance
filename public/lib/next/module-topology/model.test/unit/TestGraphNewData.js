function TestGraphNewData(CLASS) {
    test("new Graph(data)", function () {
        var data = {
            vertices: [{
                id: 0
            }, {
                id: 1
            }],
            edges: [{
                source: 0,
                target: 1
            }]
        };
        var graph = new CLASS(data);
        ok(graph.vertices().length() == 2, "Vertices length");
        ok(graph.edges().length() == 1, "Edges length");
    });
}
