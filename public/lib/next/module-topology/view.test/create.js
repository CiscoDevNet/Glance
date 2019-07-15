module("topology");

test("create", function () {
    var topology = new nx.topology.view.Topology({
        data: {
            vertices: vertices,
            edges: edges
        }
    });
    var stage = topology.stage();
    ok(stage, "created stage");
    equal(stage.childList().length(), vertices.length + edges.length, "nodes and links");
    equal(stage._dom.childNodes.length, vertices.length + edges.length, "dom append");
});

test("create group", function () {
    var topology = new nx.topology.view.Topology({
        data: {
            vertices: [{
                id: 1
            }, {
                id: 2
            }, {
                id: 3
            }, {
                id: 4
            }],
            unions: [{
                id: 100,
                collapse: false,
                entities: [1, 2]
            }]
        }
    });
    var stage = topology.stage();
    var children = stage.childList();
    equal(children.length(), 3, "Created views");
    ok(nx.is(children.get(0), nx.topology.view.Group), "Created the group");
    ok(nx.is(children.get(1), nx.topology.view.Node) && nx.is(children.get(2), nx.topology.view.Node), "Created the nodes");
    var grouped = children.get(0).childList();
    equal(grouped.get(0).childList().length(), 3, "Expanded group content");
    ok(nx.is(grouped.get(0).childList().get(1), nx.topology.view.Node) && nx.is(grouped.get(0).childList().get(2), nx.topology.view.Node), "Expanded group containing nodes");
    topology.model().unions().get(0).collapse(true);
    equal(grouped.get(0).childList().length(), 1, "Collapsed group content");
});
