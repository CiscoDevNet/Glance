function TestGraphMappingVertex(CLASS) {
    var Util = nx.topology.common.Util;
    test("Vertex model mapping", function () {
        var graph = new CLASS({
            vertices: [{
                id: 0,
                name: "host-0",
                type: "host",
                os: "windows",
                osversion: "10",
            }, {
                id: 1,
                type: "host",
                os: "windows",
                osversion: "7"
            }]
        });
        var vertex0 = graph.entitiesMap().get(0);
        var vertex1 = graph.entitiesMap().get(1);
        var data0 = vertex0.originalData();
        var data1 = vertex1.originalData();
        // create some mapping on vertex
        var mapping;
        mapping = Util.buildDirectMappings("name", "status");
        ok(mapping.length === 2 && mapping[0].sources === "name" && mapping[0].targets === "name", "Multiple mapping definition created.");
        graph.mappingVertices().push.apply(graph.mappingVertices(), mapping);
        mapping = Util.buildDirectMapping("type", "icon");
        ok(mapping.sources === "type" && mapping.targets === "icon", "Single mapping definition created.");
        graph.mappingVertices().push(mapping);
        graph.mappingVertices().push({
            sources: "name, os, osversion",
            targets: "label",
            input: function (n, o, v) {
                return [n || (o + " " + v)];
            }
        });
        graph.mappingVertices().push({
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
        ok(vertex0.name() === "host-0" && vertex0.status() === undefined, "Model multiple direct-mapping initialized correct.");
        ok(vertex0.icon() === "host", "Model single direct-mapping initialized correct.");
        ok(vertex0.label() === "host-0" && vertex1.label() === "windows 7", "Model mapping initialized correct.");
        ok(vertex0.os() === "windows-10" && vertex1.os() === "windows-7", "Model mapping initialized correct.");
        vertex0.name("host-1");
        ok(data0.name === "host-1", "Data mapping correct with multiple direct-mapping");
        vertex0.icon("router");
        ok(data0.type === "router", "Data mapping correct with single direct-mapping");
        vertex0.label("win 10");
        ok(data0.name === "host-1" && data0.os === "windows" && data0.osversion === "10", "Data correct with no output");
        vertex1.os("windows-8.1");
        ok(data1.os === "windows" && data1.osversion === "8.1", "Data correct with output");
        var vertex2 = graph.createVertex({
            id: 2,
            name: "router-1",
            status: "green",
            type: "router",
            os: "ios",
            osversion: "3.5"
        });
        var data2 = vertex2.originalData();
        ok(!vertex2.name, "Model initialized correct");
        graph.vertices().push(vertex2);
        ok(vertex2.name() === "router-1" && vertex2.status() === "green", "Model multiple direct-mapping correct.");
        ok(vertex2.icon() === "router", "Model single direct-mapping correct.");
        ok(vertex2.label() === "router-1" && vertex2.os() === "ios-3.5", "Model mapping correct.");
        vertex2.name("switch-0");
        ok(data2.name === "switch-0", "Data mapping correct with multiple direct-mapping");
        vertex2.icon("switch");
        ok(data2.type === "switch", "Data mapping correct with single direct-mapping");
        vertex2.label("distribution");
        ok(data2.name === "switch-0", "Data correct with no output");
        vertex2.os("windows-8.1");
        ok(data2.os === "windows" && data2.osversion === "8.1", "Data correct with output");
    });
}
