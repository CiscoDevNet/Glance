var vertices = [{
    id: 0
}, {
    id: 1
}, {
    id: 2
}, {
    id: 3
}, {
    id: 4
}];
var edges = [{
    id: "01",
    source: 0,
    target: 1
}, {
    id: "02",
    source: 0,
    target: 2
}, {
    id: "13",
    source: 1,
    target: 3
}, {
    id: "14",
    source: 1,
    target: 4
}];

function getConnectionBetween(graph, vertex1, vertex2) {
    var found;
    graph.connections().each(function (connection) {
        if (connection.source() === vertex1 && connection.target() === vertex2 || connection.source() === vertex2 && connection.target() === vertex1) {
            found = connection;
            return false;
        }
    });
    return found;
}

function getEdgesBetween(graph, vertex1, vertex2) {
    var found = [];
    graph.edges().each(function (edge) {
        if (edge.source() === vertex1 && edge.target() === vertex2 || edge.source() === vertex2 && edge.target() === vertex1) {
            found.push(edge);
        }
    });
    return found;
}

function checkContainment(list, e) {
    if (!list) {
        return false;
    }
    // e is array
    if (Object.prototype.toString.call(e) === "[object Array]") {
        if (list.length() !== e.length) {
            return false;
        }
        var i, item;
        for (i = 0; i < e.length && list.contains(e[i]); i++);
        return i == e.length;
    }
    return list.length() === 1 && list.contains(e);
}

function checkEdgeContainment(es, e) {
    if (!es) {
        return false;
    }
    return checkContainment(es.edges(), e);
}

function addEdges(graph, pairs) {
    var edges = [];
    nx.each(pairs.replace(/\s/g, "").split(","), function (s) {
        var edge = graph.createEdge({
            source: s.charAt(0) * 1,
            target: s.charAt(1) * 1
        });
        edges.push(edge);
        graph.edges().push(edge);
    });
    return edges;
}

function getDetail(graph) {
    var o = {};
    graph.vertices().each(function (item) {
        o["vertex" + item.id()] = item;
    });
    graph.edges().each(function (item) {
        var sid = item.source().id();
        var tid = item.target().id();
        o["edge" + (sid < tid ? sid : tid) + (sid > tid ? sid : tid)] = item;
    });
    graph.unions && graph.unions().each(function (item) {
        o["union" + item.id()] = item;
    });
    graph.connections && graph.connections().each(function (item) {
        var sid = item.source().id();
        var tid = item.target().id();
        o["edge" + (sid < tid ? sid : tid) + (sid > tid ? sid : tid)] = item;
    });
    return o;
}
