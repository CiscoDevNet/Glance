function TestCollapsibleGraphCollapseWithEdge(CLASS) {
    test("Collapse with edge", function () {
        var graph = new CLASS({
            vertices: vertices,
            edges: edges,
            // 6:[0,2,5:[1,3,4]]
            unions: [{
                id: 6,
                entities: [0, 2, 5],
                root: 0
            }, {
                id: 5,
                collapse: true,
                entities: [1, 3, 4],
                root: 1
            }]
        });
        var vertex, vertex0, vertex1, vertex2, vertex3, vertex4;
        vertex0 = graph.entitiesMap().get(0);
        vertex1 = graph.entitiesMap().get(1);
        vertex2 = graph.entitiesMap().get(2);
        vertex3 = graph.entitiesMap().get(3);
        vertex4 = graph.entitiesMap().get(4);
        var union5, union6;
        union5 = graph.entitiesMap().get(5);
        union6 = graph.entitiesMap().get(6);
        var edge01, edge02, edge13, edge14;
        var elist, connection01, connection02, connection13, connection14, connection05;
        edge01 = graph.edgeMap().get("01");
        edge02 = graph.edgeMap().get("02");
        edge13 = graph.edgeMap().get("13");
        edge14 = graph.edgeMap().get("14");
        elist = graph.connections();
        // initializing status
        connection01 = getConnectionBetween(graph, vertex0, vertex1);
        connection02 = getConnectionBetween(graph, vertex0, vertex2);
        connection13 = getConnectionBetween(graph, vertex1, vertex3);
        connection14 = getConnectionBetween(graph, vertex1, vertex4);
        connection05 = getConnectionBetween(graph, vertex0, union5);
        ok(union6.edges().length() === 0 && checkEdgeContainment(union5, edge01), "Initializing union's edge correct.");
        ok(checkEdgeContainment(connection05, edge01) && checkEdgeContainment(connection02, edge02) && !connection01 && !connection13 && !connection14, "Initializing connection correct.");
        ok(elist.length() === 2 && elist.contains(connection05) && elist.contains(connection02), "Initializing connection list correct.");
        // expanding status
        union5.collapse(false);
        connection01 = getConnectionBetween(graph, vertex0, vertex1);
        connection02 = getConnectionBetween(graph, vertex0, vertex2);
        connection13 = getConnectionBetween(graph, vertex1, vertex3);
        connection14 = getConnectionBetween(graph, vertex1, vertex4);
        connection05 = getConnectionBetween(graph, vertex0, union5);
        ok(graph.connections().length() === 4, "Collapsible-expanding connection list length correct.");
        ok(checkEdgeContainment(connection01, edge01) && checkEdgeContainment(connection02, edge02) && checkEdgeContainment(connection13, edge13) && checkEdgeContainment(connection14, edge14) && !connection05, "Collapsible-expanding connection correct.");
        // collapsing status
        union5.collapse(true);
        connection01 = getConnectionBetween(graph, vertex0, vertex1);
        connection02 = getConnectionBetween(graph, vertex0, vertex2);
        connection13 = getConnectionBetween(graph, vertex1, vertex3);
        connection14 = getConnectionBetween(graph, vertex1, vertex4);
        connection05 = getConnectionBetween(graph, vertex0, union5);
        ok(graph.connections().length() === 2, "Collapsible-collapsing connection list length correct.");
        ok(checkEdgeContainment(connection05, edge01) && checkEdgeContainment(connection02, edge02) && !connection01 && !connection13 && !connection14, "Collapsible-collapsing connection correct.");
    });
}
