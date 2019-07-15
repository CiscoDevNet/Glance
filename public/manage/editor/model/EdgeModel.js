(function (nx) {
    var EXPORT = nx.define("devme.manage.editor.model.EdgeModel", devme.manage.editor.model.VertexModel, {
        properties: {
            edgeList: function () {
                return new nx.List();
            },
            edgeMap: function () {
                return new nx.Map();
            },
            polygonList: function () {
                return new nx.List();
            },
            polygonMap: function () {
                return new nx.Map();
            }
        },
        methods: {
            init: function (data) {
                this.inherited();
                this.append(data);
            },
            append: function (data) {
                this.appendVertices(data && data.vertices);
                this.appendEdges(data && data.edges);
                this.appendPolygons(data && data.polygons);
            },
            appendEdges: function (data) {
                if (!data) {
                    return;
                }
                var list = this.edgeList();
                var map = this.edgeMap();
                var vertexMap = this.vertexMap();
                var i, item, edge, start, end;
                for (i = data.length - 1; i >= 0; i--) {
                    item = data[i];
                    // get start and end vertices
                    start = vertexMap.get(item.start);
                    end = vertexMap.get(item.end);
                    // validate them
                    if (!start || !end) {
                        throw new Error("Bad data of missing vertex.");
                    }
                    // create edge
                    edge = new EXPORT.Edge();
                    edge.id(item.id);
                    edge.start(start);
                    edge.end(end);
                    edge.width(item.width || 1);
                    // add to list and map
                    list.push(edge);
                    map.set(item.id, edge);
                }
            },
            appendPolygons: function (data) {
                if (!data) {
                    return;
                }
                var list = this.polygonList();
                var map = this.polygonMap();
                var vertexMap = this.vertexMap();
                var i, item, polygon, vertices;
                for (i = data.length - 1; i >= 0; i--) {
                    item = data[i];
                    // get all vertices
                    vertices = [];
                    nx.each(item.vertices, function (id) {
                        var vertex = vertexMap.get(id);
                        if (!vertex) {
                            vertices = null;
                            return false;
                        }
                        vertices.push(vertex);
                    });
                    // validate them
                    if (!vertices) {
                        throw new Error("Bad data of missing vertex.");
                    }
                    polygon = new EXPORT.Polygon();
                    polygon.id(item.id);
                    polygon.label(item.label);
                    polygon.closed(item.closed);
                    polygon.width(item.width || 1);
                    polygon.vertices(new nx.List(vertices));
                    // add to list and map
                    list.push(polygon);
                    map.set(item.id, polygon);
                }
            },
            toData: function () {
                // TODO
            },
            getEdgesByVertex: function (vertex) {
                // TODO
            }
        },
        statics: {
            Edge: nx.define({
                properties: {
                    id: null,
                    start: null,
                    end: null,
                    width: 1
                }
            }),
            Polygon: nx.define({
                properties: {
                    id: null,
                    label: "",
                    closed: true,
                    width: 1,
                    vertices: function () {
                        return new nx.List();
                    },
                    edges: nx.binding("vertices", function (vertices) {
                        if (!vertices) {
                            return;
                        }
                        var self = this;
                        var edges = new nx.List();
                        edges.retain(vertices.monitorDiff(function (evt) {
                            var edge, prevedge, nextedge, vertex;
                            var i, n, d, v, diff, diffs = [];
                            for (i = 0; i < evt.diffs.length; i++) {
                                diff = evt.diffs[i].slice();
                                switch (diff[0]) {
                                case "splice":
                                    n = diff[1], d = diff[2], v = diff[3];
                                    break;
                                case "add":
                                    n = diff[1], d = 0, v = diff[2];
                                    break;
                                case "remove":
                                    n = diff[1], d = diff[2], v = null;
                                    break;
                                }
                                prevedge = edges.get(n - 1);
                                nextedge = edges.get(Math.max(n + d, edges.length()) % edges.length() || 0);
                                if (v && v.length) {
                                    prevedge && prevedge.end(v[0]);
                                    for (i = 0; i < v.length; i++) {
                                        if (i >= d) {
                                            // need to create an edge
                                            edge = new EXPORT.Edge();
                                            edge.id(nx.uuid(true));
                                            edge.retain(self.watch("width", function (pname, width) {
                                                edge.width(width);
                                            }));
                                            edges.splice(n + i, 0, edge);
                                        } else {
                                            edge = edges.get(n + i);
                                        }
                                        edge.start(v[i]);
                                        edge.end(v[i + 1] || nextedge && nextedge.start() || v[0]);
                                    }
                                    if (d > i) {
                                        edges.splice(n + i, d - i);
                                    }
                                } else if (d >= 0) {
                                    edges.splice(n, d);
                                    prevedge && nextedge && prevedge.end(nextedge.start());
                                }
                            }
                        }));
                        this.retain("edges", edges);
                        return edges;
                    })
                }
            })
        }
    });
})(nx);
