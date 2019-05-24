function TestCollapsibleGraphAddWrongUnion(CLASS) {
    test("Add wrong union", function () {
        var graph = new CLASS();
        graph.unions().push(1);
        ok(graph.vertices().length() === 0, "Adding wrong union denied.");
    });
}
