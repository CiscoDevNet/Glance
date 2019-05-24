function TestGraphMappingEdge(CLASS) {
    var Util = nx.topology.common.Util;
    test("Edge model mapping", function () {
        var graph = new CLASS({
            vertices: [{
                id: 0
            }, {
                id: 1
            }, {
                id: 2
            }],
            edges: [{
                id: "01",
                name: "link-01",
                source: 0,
                target: 1
            }]
        });
        var edge01 = graph.edgeMap().get("01");
        var data01 = edge01.originalData();
        // create some mapping on vertex
        var mapping;
        mapping = Util.buildDirectMappings("name", "status");
        ok(mapping.length === 2 && mapping[0].sources === "name" && mapping[0].targets === "name", "Multiple mapping definition created.");
        graph.mappingEdges().push.apply(graph.mappingEdges(), mapping);
        mapping = Util.buildDirectMapping("type", "edgestyle");
        ok(mapping.sources === "type" && mapping.targets === "edgestyle", "Single mapping definition created.");
        graph.mappingEdges().push(mapping);
        graph.mappingEdges().push({
            sources: "name, source, target",
            targets: "label",
            input: function (n, s, t) {
                return [n || (s + "-" + t)];
            }
        });
        graph.mappingEdges().push({
            sources: "source, target",
            targets: "direction",
            input: function (s, t) {
                return [s + "-" + t];
            },
            output: function (d) {
                var idx = d.indexOf("-");
                return [d.substring(0, idx), d.substring(idx + 1)];
            }
        });
        // test effect
        ok(edge01.name() === "link-01" && edge01.status() === undefined, "Model multiple direct-mapping initialized correct.");
        ok(edge01.edgestyle() === undefined, "Model single direct-mapping initialized correct.");
        ok(edge01.label() === "link-01", "Model mapping initialized correct.");
        ok(edge01.direction() === "0-1", "Model mapping initialized correct.");
        edge01.name("link-one");
        ok(data01.name === "link-one", "Data mapping correct with multiple direct-mapping");
        edge01.edgestyle("solid");
        ok(data01.type === "solid", "Data mapping correct with single direct-mapping");
        edge01.label("Some edge");
        ok(data01.name === "link-one" && data01.source === "0" && data01.target === "1", "Data correct with initial output");
        edge01.direction("1-0");
        ok(data01.source === "1" && data01.target === "0", "Data correct with output");
        var edge12 = graph.createEdge({
            id: "12",
            source: 1,
            target: 2,
            name: "link-12",
            status: "blocked",
            type: "dashed"
        });
        var data12 = edge12.originalData();
        ok(!edge12.name, "Model initialized correct");
        graph.edges().push(edge12);
        ok(edge12.name() === "link-12" && edge12.status() === "blocked", "Model multiple direct-mapping correct.");
        ok(edge12.edgestyle() === "dashed", "Model single direct-mapping correct.");
        ok(edge12.label() === "link-12" && edge12.direction() === "1-2", "Model mapping correct.");
        edge12.name("link-two");
        ok(data12.name === "link-two", "Data mapping correct with multiple direct-mapping");
        edge12.edgestyle("dotted");
        ok(data12.type === "dotted", "Data mapping correct with single direct-mapping");
        edge12.label("foobar");
        ok(data12.name === "link-two" && data12.source === "1" && data12.target === "2", "Data correct with initial output");
        edge12.direction("any-thing");
        ok(data12.source === "any" && data12.target === "thing", "Data correct with output");
    });
}
