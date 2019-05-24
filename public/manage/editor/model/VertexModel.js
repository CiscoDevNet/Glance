(function (nx) {
    var EXPORT = nx.define("devme.manage.editor.model.VertexModel", {
        properties: {
            vertexList: function () {
                return new nx.List();
            },
            vertexMap: function () {
                return new nx.Map();
            }
        },
        methods: {
            init: function (data) {
                this.inherited();
                this.append(data);
            },
            appendVertices: function (data) {
                if (!data) {
                    return;
                }
                data = data.slice();
                var list = this.vertexList();
                var map = this.vertexMap();
                var length;
                data = data.slice();
                while (data && data.length) {
                    length = data.length;
                    var i, item, vertex, start, end;
                    for (i = data.length - 1; i >= 0; i--) {
                        item = data[i];
                        // TODO make sure item has ID
                        if (item.start && item.end) {
                            start = map.get(item.start);
                            end = map.get(item.end);
                            if (!start && !end) {
                                continue;
                            }
                            vertex = new EXPORT.Vertex();
                            vertex.id(item.id);
                            vertex.start(start);
                            vertex.end(end);
                            vertex.rate(item.rate || 0);
                            vertex.sticky(true);
                        } else if (item.start && !item.rate) {
                            start = map.get(item.start);
                            vertex = new EXPORT.Vertex();
                            vertex.id(item.id);
                            vertex.start(start);
                            vertex.end(null);
                            vertex.rate(0);
                            vertex.sticky(true);
                        } else {
                            vertex = new EXPORT.Vertex();
                            vertex.id(item.id);
                            vertex.x(item.x || 0);
                            vertex.y(item.y || 0);
                        }
                        data.splice(i, 1);
                        list.push(vertex);
                        map.set(item.id, vertex);
                    }
                    if (length === data.length) {
                        throw new Error("Bad data", data);
                    }
                }
            },
            toData: function () {
                // TODO
            },
            getNearestVertex: function (position) {
                // TODO
            },
            getVerticesByVertex: function (vertex) {
                // TODO
            }
        },
        statics: {
            Vertex: nx.define({
                properties: {
                    id: null,
                    sticky: false,
                    start: null,
                    end: null,
                    rate: null,
                    x: nx.binding("sticky", true, function (property, sticky) {
                        if (sticky) {
                            property.set(nx.binding("start.x, end.x, rate", function (start, end, rate) {
                                if (nx.is(start, "Number")) {
                                    if (rate === 0) {
                                        return start;
                                    }
                                    if (nx.is(start, "Number") && nx.is(end, "Number") && rate > 0) {
                                        return start * rate + end * (1 - rate);
                                    }
                                }
                            }));
                        } else {
                            property.release();
                        }
                    }),
                    y: nx.binding("sticky", true, function (property, sticky) {
                        if (sticky) {
                            property.set(nx.binding("start.y, end.y, rate", function (start, end, rate) {
                                if (nx.is(start, "Number")) {
                                    if (rate === 0) {
                                        return start;
                                    }
                                    if (nx.is(start, "Number") && nx.is(end, "Number") && rate > 0) {
                                        return start * rate + end * (1 - rate);
                                    }
                                }
                            }));
                        } else {
                            property.release();
                        }
                    })
                }
            })
        }
    });
})(nx);
