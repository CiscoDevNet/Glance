(function (nx) {
    var EXPORT = nx.define("devme.manage.editor.model.ActionModel", {
        properties: {
            type: null,
            done: true,
            difference: null,
            delta: {
                dependencies: "matrix",
                value: function (matrix) {
                    if (!matrix) {
                        return 5;
                    }
                    return 5 / matrix[2][0];
                }
            },
            vertices: function () {
                return new nx.List();
            },
            edges: function () {
                return new nx.List();
            },
            vertexNearbyList: {
                value: nx.binding("vertices", function (vertices) {
                    if (!vertices) {
                        return;
                    }
                    return;
                    // TODO
                    var self = this;
                    var list = nx.List.mapping(vertices, function (point) {
                        var nearby = new nx.UniqueList();
                        var px, py, delta;
                        nearby.retain(self.watch("delta", function (prop, delta) {
                            delta = delta;
                            nearby.clear();
                            nearby.push(self.getNearestVertex(x, y));
                        }));
                        nearby.retain(nx.Object.cascade(point, "x,y", function (x, y) {
                            px = x, py = y;
                            nearby.clear();
                            nearby.push(self.getNearestVertex(x, y));
                        }));
                        return nearby;
                    });
                    this.retain("vertexNearbyOfPoints", list);
                    return list;
                })
            },
            edgeNearbyList: {

            }
        },
        methods: {
            undo: function () {},
            redo: function () {},
            getNearbyVertexOfPoint: function (x, y, delta) {
                var dx, dy, vertex = this.getNearestVertex(x, y);
                if (vertex) {
                    dx = vertex.x() - x, dy = vertex.y() - y;
                    if (Math.sqrt(dx * dx + dy * dy) <= delta) {
                        return vertex;
                    }
                }
            }
        },
        statics: {}
    });
})(nx);
