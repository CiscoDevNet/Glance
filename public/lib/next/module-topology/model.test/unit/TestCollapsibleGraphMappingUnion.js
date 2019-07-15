function TestCollapsibleGraphMappingUnion(CLASS) {
    var Util = nx.topology.common.Util;
    test("Union model mapping", function () {
        var graph = new CLASS({
            vertices: vertices,
            edges: edges,
            unions: [{
                id: 5,
                collapse: true,
                entities: [1],
                root: 1
            }]
        });
        var union5 = graph.entitiesMap().get(5);
        var data5 = union5.originalData();
        var model5 = union5.model();
        // create some mapping on vertex
        var mapping;
        mapping = Util.buildDirectMappings("name", "status");
        ok(mapping.length === 2 && mapping[0].sources === "name" && mapping[0].targets === "name", "Multiple mapping definition created.");
        graph.mappingUnions().push.apply(graph.mappingUnions(), mapping);
        mapping = Util.buildDirectMapping("type", "icon");
        ok(mapping.sources === "type" && mapping.targets === "icon", "Single mapping definition created.");
        graph.mappingUnions().push(mapping);
        graph.mappingUnions().push({
            sources: "name, os, osversion",
            targets: "label",
            input: function (n, o, v) {
                return [n || (o + " " + v)];
            }
        });
        graph.mappingUnions().push({
            sources: "os, osversion",
            targets: "os",
            input: function (o, v) {
                return [o + "-" + v];
            },
            output: function (os) {
                var idx = os.indexOf("-");
                if (idx >= 0) {
                    return [os.substring(0, idx), os.substring(idx + 1)];
                } else {
                    return [os, undefined];
                }
            }
        });
        // test effect
        ok(model0.get("name") === "host-0" && model0.get("status") === undefined, "Model multiple direct-mapping initialized correct.");
        ok(model0.get("icon") === "host", "Model single direct-mapping initialized correct.");
        ok(model0.get("label") === "host-0" && model1.get("label") === "windows 7", "Model mapping initialized correct.");
        ok(model0.get("os") === "windows-10" && model1.get("os") === "windows-7", "Model mapping initialized correct.");
        model0.set("name", "host-1");
        ok(data0.name === "host-1", "Data mapping correct with multiple direct-mapping");
        model0.set("icon", "router");
        ok(data0.type === "router", "Data mapping correct with single direct-mapping");
        model0.set("label", "win 10");
        ok(data0.name === "host-1" && data0.os === "windows" && data0.osversion === "10", "Data correct with no output");
        model1.set("os", "windows-8.1");
        ok(data1.os === "windows" && data1.osversion === "8.1", "Data correct with output");
        var union6 = graph.createUnion({
            id: 6
        });
        var data2 = vertex2.originalData();
        var model2 = vertex2.model();
        ok(vertex2.model().length() === 0, "Model initialized correct");
        graph.vertices().push(vertex2);
        ok(model2.get("name") === "router-1" && model2.get("status") === "green", "Model multiple direct-mapping correct.");
        ok(model2.get("icon") === "router", "Model single direct-mapping correct.");
        ok(model2.get("label") === "router-1" && model2.get("os") === "ios-3.5", "Model mapping correct.");
        model2.set("name", "switch-0");
        ok(data2.name === "router-0", "Data mapping correct with multiple direct-mapping");
        model2.set("icon", "switch");
        ok(data2.type === "switch", "Data mapping correct with single direct-mapping");
        model2.set("label", "distribution");
        ok(data2.name === "switch-0" && data0.os === "ios" && data0.osversion === "3.5", "Data correct with no output");
        model2.set("os", "windows-8.1");
        ok(data2.os === "windows" && data2.osversion === "8.1", "Data correct with output");
    });
}
