function TestCollapsibleGraphNewData(CLASS) {
    test("new CollapsibleGraph(data)", function () {
        var data = {
            vertices: vertices,
            edges: edges,
            // 6:[0,2,5:[1,3,4]]
            unions: [{
                id: 5,
                entities: [1, 3, 4],
                root: 1
            }, {
                id: 6,
                entities: [0, 2, 5],
                root: 0
            }]
        };
        var graph = new CLASS(data);
        ok(graph.vertices().length() == 5, "Vertices length");
        ok(graph.edges().length() == 4, "Edges length");
        ok(graph.unions().length() == 2, "Unions length");
    });
}
