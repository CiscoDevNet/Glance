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
            append: function (data) {
                if (!data) {
                    return;
                }
                data = data.slice();
                var list = this.vertexList();
                var map = this.vertexMap();
                data = data.slice();
                while (data && data.length) {
                    var i, item, vertex, start, end;
                    for (i = data.length; i >= 0; i--) {
                        item = data[i];
                        // TODO make sure item has ID
                        if (item.start && item.end) {
                            start = map.get(item.start);
                            end = map.get(item.end);
                            if (!start && !end) {
                                continue;
                            }
                            vertex = new EXPORT.VertexSticky();
                            vertex.id(item.id);
                            vertex.rate(item.rate || 0);
                            vertex.start(start);
                            vertex.end(end);
                        } else {
                            vertex = new EXPORT.Vertex();
                            vertex.id(item.id);
                            vertex.position(item.position || [item.x || 0, item.y || 0]);
                        }
                        data.splice(i, 1);
                        list.push(vertex);
                        map.set(item.id, vertex);
                    }
                }
            },
            toData: function () {
		// TODO
            },
            getNearestVertex: function (position) {
                // TODO
            }
        },
        statics: {
            Vertex: nx.define({
                properties: {
                    id: null,
                    position: null
                }
            }),
            VertexSticky: nx.define({
                properties: {
                    id: null,
                    start: null,
                    end: null
                    rate: null,
                    position: nx.binding("start.position, end.position, rate", function (start, end, rate) {
                        if (start && end && rate >= 0) {
                            return [start[0] * rate + end[0] * (1 - rate), start[1] * rate + end[1] * (1 - rate)];
                        }
                    })
                }
            })
        }
    });
})(nx);
