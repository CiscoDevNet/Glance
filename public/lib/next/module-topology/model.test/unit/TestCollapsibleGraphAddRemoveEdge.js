function TestCollapsibleGraphAddRemoveEdge(CLASS) {
    test("Add/Remove edge", function () {
        var graph = new CLASS({
            // Five-vertexed star
            vertices: vertices,
            unions: [{
                id: 5,
                entities: [1, 3]
            }, {
                id: 6,
                entities: [2, 4]
            }]
        });
        var vertex0, vertex1, vertex2, vertex3, vertex4;
        vertex0 = graph.entitiesMap().get(0);
        vertex1 = graph.entitiesMap().get(1);
        vertex2 = graph.entitiesMap().get(2);
        vertex3 = graph.entitiesMap().get(3);
        vertex4 = graph.entitiesMap().get(4);
        var union5, union6;
        union5 = graph.entitiesMap().get(5);
        union6 = graph.entitiesMap().get(6);
        var elist = graph.connections();
        // NOW YOU'LL KNOW WHY I WANT JS SUPPORTS MACRO
        function status() {
            var o = {};
            var entities = [vertex0, vertex1, vertex2, vertex3, vertex4];
            var unions = [vertex0, vertex1, vertex2, vertex3, vertex4, union5, union6];
            nx.each(entities, function (vertex, index) {
                o["edges" + index] = vertex.edges().toArray();
            });
            nx.each("01,02,03,04,12,13,14,23,24,34".split(","), function (s) {
                o["edges" + s] = getEdgesBetween(graph, entities[s.charAt(0) * 1], entities[s.charAt(1) * 1]);
            });
            nx.each("01,02,03,04,05,06,12,13,14,15,16,23,24,25,26,34,35,36,45,46,56".split(","), function (s) {
                o["connection" + s] = getConnectionBetween(graph, unions[s.charAt(0) * 1], unions[s.charAt(1) * 1]);
            });
            o.edges011214 = o.edges01.concat(o.edges12, o.edges14);
            o.edges032334 = o.edges03.concat(o.edges23, o.edges34);
            o.edges021223 = o.edges02.concat(o.edges12, o.edges23);
            o.edges041434 = o.edges04.concat(o.edges14, o.edges34);
            return o;
        }
        ok(graph.edges().length() === 0 && graph.connections().length() === 0, "--:(init) No edge no connection at first.");
        // add edges
        addEdges(graph, "01,02,03,04,12,13,14,23,24,34");
        with(status()) {
                ok(graph.edges().length() === 10 && graph.connections().length() === 10, "--:(add) edge & connection length correct.");
                ok(checkEdgeContainment(union5, edges011214.concat(edges032334)) && checkEdgeContainment(union6, edges021223.concat(edges041434)), "--:(add) union edges correct.");
                ok(checkEdgeContainment(connection01, edges01) && checkEdgeContainment(connection13, edges13), "--:(add) connection edges correct.");
                ok(!connection05 && !connection06 && !connection56, "--:(add) no connection from expanded union.");
            }
            // collapse a union
        union5.collapse(true);
        with(status()) {
                ok(graph.edges().length() === 10 && graph.connections().length() === 6, "+-:(collapse) edge & connection length correct.");
                ok(checkEdgeContainment(connection05, edges01.concat(edges03)) && !connection13, "+-:(collapse) connection between union and vertex (standalone) correct.");
                ok(checkEdgeContainment(connection25, edges12.concat(edges23)) && !connection12, "+-:(collapse) connection between union and vertex (in union) correct.");
                ok(!connection01 && !connection12 && !connection16, "+-:(collapse) no connection from vertex in collapsed union.");
                ok(!connection06 && !connection56, "+-:(collapse) no connection from expanded union.");
            }
            // add some more edges
        var edges = addEdges(graph, "01,12");
        with(status()) {
                ok(graph.edges().length() === 12 && graph.connections().length() === 6, "+-:(add) edge & connection length correct.");
                ok(edges01.length === 2 && edges12.length === 2, "+-:(add) edge length between vertex correct.");
                ok(checkEdgeContainment(connection05, edges01.concat(edges03)) && !connection13, "+-:(add) connection between union and vertex (standalone) correct.");
                ok(checkEdgeContainment(connection25, edges12.concat(edges23)) && !connection12, "+-:(add) connection between union and vertex (in union) correct.");
                ok(!connection01 && !connection12 && !connection16, "+-:(collapse) no connection from vertex in collapsed union.");
                ok(!connection06 && !connection56, "+-:(collapse) no connection from expanded union.");
            }
            // exapnd a union
        union5.collapse(false);
        with(status()) {
                ok(graph.edges().length() === 12 && graph.connections().length() === 10, "--:(expand) edge & connection length correct.");
                ok(edges011214.length === 5 && edges032334.length === 3, "--:(expand) edge length from vertex correct.");
                ok(checkEdgeContainment(union5, edges011214.concat(edges032334)) && checkEdgeContainment(union6, edges021223.concat(edges041434)), "--:(expand) union edges correct.");
                ok(checkEdgeContainment(connection01, edges01) && checkEdgeContainment(connection13, edges13), "--:(expand) connection edges correct.");
                ok(!connection05 && !connection06 && !connection56, "--:(expand) no connection from expanded union.");
            }
            // collapse all union
        union5.collapse(true);
        union6.collapse(true);
        with(status()) {
            ok(graph.connections().length() === 3, "++:(collapse) connection length correct.");
            ok(checkEdgeContainment(connection05, edges01.concat(edges03)) && checkEdgeContainment(connection06, edges02.concat(edges04)) && !connection13 && !connection24, "++:(collapse) connection between union and vertex (standalone) correct.");
            ok(checkEdgeContainment(connection56, edges12.concat(edges14, edges23, edges34)), "++:(collapse) connection between collapsed union correct.");
            ok(!connection01 && !connection02 && !connection03 && !connection04 && !connection12 && !connection14 && !connection23 && !connection34, "++:(collapse) no connection from collapsed vertex.");
        }
    });
}
