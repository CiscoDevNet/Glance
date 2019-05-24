function TestCollapsibleGraphCreateAddUnion(CLASS) {
    test("Create/Add union", function () {
        var graph = new CLASS({
            vertices: vertices,
            edges: edges
        });
        var vertex, vertex0, vertex1, vertex2, vertex3, vertex4;
        vertex0 = graph.entitiesMap().get(0);
        vertex1 = graph.entitiesMap().get(1);
        vertex2 = graph.entitiesMap().get(2);
        vertex3 = graph.entitiesMap().get(3);
        vertex4 = graph.entitiesMap().get(4);
        var union, union5, union6;
        // create union
        union5 = graph.createUnion({
            id: 5,
            entities: [1, 3, 4],
            root: 1
        });
        ok(union5 && nx.is(union5, nx.topology.model.Union), "Union created");
        ok(graph.unions().length() == 0, "Create union means not insert");
        ok(union5.id() === 5, "Vertex ID correct");
        ok(checkContainment(union5.entities(), [vertex1, vertex3, vertex4]), "Union children correct.");
        ok(union5.vertexRoot() === vertex1, "Union root correct.");
        ok(union5.vertices().length() === 0, "Union leaf list empty until add.");
        // check if creation before add
        union6 = graph.createUnion({ // gets a null value since union no.5 not add into the graph
            entities: [0, 2, 5],
            root: 0
        });
        ok(!union6, "Create union failed if any child not exists or added.");
        // add union
        graph.unions().push(union5);
        ok(graph.unions().length() == 1, "Union add to list.");
        ok(graph.entitiesMap().get(5) == union5, "Union add to map.");
        ok(checkContainment(union5.vertices(), [vertex1, vertex3, vertex4]), "Union leaf list correct.");
        // add it again to check duplication
        graph.unions().push(union5);
        ok(graph.unions().length() == 1, "Union duplicated addition failed.");
        // create another node-set, generate an ID if not given
        union6 = graph.createUnion({
            entities: [0, 2, 5],
            root: 0
        });
        ok(union6, "Create Union succeed after all children exist.");
        ok(checkContainment(union6.entities(), [vertex0, vertex2, union5]), "Union children with child-union correct.");
        ok(union6.vertexRoot() === vertex0, "Union root correct.");
        graph.unions().push(union6);
        ok(graph.entitiesMap().get(union6.id()) == union6, "Union ID generated and add to map.");
        ok(checkContainment(union6.vertices(), [vertex0, vertex1, vertex2, vertex3, vertex4]), "Union leaf list with child-union correct.");
        // check ID conflict
        // create a self-conflict node-set
        union = graph.createUnion({
            id: 0,
            entities: [0, 2, 5],
            root: 0
        });
        ok(!union, "Create union failed, self-containing not allowed.");
        // create and add union with conflict ID with union
        union = graph.createUnion({
            id: union6.id(),
            entities: [0, 2, 5],
            root: 0
        });
        ok(union, "Create union success, ID conflict with other union doesn't matter.");
        graph.unions().push(union);
        ok(checkContainment(graph.unions(), [union5, union6]), "Union add to list failed because ID conflict with union.");
        // create and add union with conflict ID with vertex
        union = graph.createUnion({
            id: 1,
            entities: [0, 2, 5],
            root: 0
        });
        ok(union, "Create union success, ID conflict with other vertex doesn't matter.");
        graph.unions().push(union);
        ok(checkContainment(graph.unions(), [union5, union6]), "Union add to list failed because ID conflict with vertex.");
        // create and add vertex with conflict ID with union
        vertex = graph.createVertex({
            id: 5
        });
        ok(vertex, "Create vertex success, ID conflict with other union doesn't matter.");
        graph.vertices().push(vertex);
        ok(checkContainment(graph.vertices(), [vertex0, vertex1, vertex2, vertex3, vertex4]), "Vertex add to list failed because ID conflict with union.");
    });
}
