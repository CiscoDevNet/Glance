/// require util
/// require bean

(function (nx, global) {

    var Util = nx.path(global, "nx.topology.common.Util");

    /**
     * Basic graph class, supporting vertex/edge model.
     *
     * @class Graph
     * @namespace nx.topology.model
     * @constructor
     * @param data Initialize data of graph.
     */
    var EXPORT = nx.define('nx.topology.model.Graph', {
        properties: {
            /**
             * A map contains pairs of vertex id and edge.
             *
             * @type nx.Map
             * @property entitiesMap
             */
            entitiesMap: {
                value: function () {
                    return new nx.Map();
                }
            },
            /**
             * A list contains all entities.
             *
             * @type nx.topology.common.FilterUniqueList
             * @property vertices
             */
            vertices: {
                dependencies: "entitiesMap",
                value: function (map) {
                    if (!map) {
                        return;
                    }
                    var list = new nx.topology.common.FilterUniqueList();
                    // initialize the vertices
                    list.filters().push(Util.getTypeFilter(nx.topology.model.Vertex));
                    list.filters().push(Util.getIdFilter(map));
                    // sync vertices and entitiesMap
                    list.monitorContaining(function (item) {
                        map.set(item.id(), item);
                        return function () {
                            map.remove(item.id());
                        };
                    });
                    return list;
                }
            },
            /**
             * A list contains all edges.
             *
             * @type nx.topology.common.FilterUniqueList
             * @property edges
             */
            edges: {
                dependencies: "entitiesMap, vertices",
                value: function (entitiesMap, vertices) {
                    if (!entitiesMap || !vertices) {
                        return;
                    }
                    var list = new nx.topology.common.FilterUniqueList();
                    var entitiesMap = this.entitiesMap();
                    // sync vertices and edge
                    vertices.monitorContaining(function (vertex) {
                        return function () {
                            var i, edge;
                            for (i = list.length() - 1; i >= 0; i--) {
                                edge = list.get(i);
                                if (edge.source() === vertex || edge.target() === vertex) {
                                    list.splice(i, 1);
                                }
                            }
                        };
                    });
                    // make sure link reachable
                    list.filters().push(function (item) {
                        if (!item || !nx.is(item, nx.topology.model.Edge)) {
                            return false;
                        }
                        if (!item.target() || !item.source()) {
                            return false;
                        }
                        return entitiesMap.has(item.target().id()) && entitiesMap.has(item.source().id());
                    });
                    // sync edges and vertex.edges
                    list.monitorContaining(function (edge) {
                        var source = entitiesMap.get(edge.source().id());
                        var target = entitiesMap.get(edge.target().id());
                        source.edges().push(edge);
                        target.edges().push(edge);
                        return function () {
                            source.edges().remove(edge);
                            target.edges().remove(edge);
                        };
                    });
                    return list;
                }
            },
            /**
             * A map contains pairs of edge id and edge.
             *
             * @type nx.Map
             * @property edgeMap
             */
            edgeMap: {
                dependencies: "edges",
                value: function (list) {
                    var map = new nx.Map();
                    // sync edges and edgeMap
                    list.monitorContaining(function (item) {
                        map.set(item.id(), item);
                        return function () {
                            map.remove(item.id());
                        };
                    });
                    return map;
                }
            },
            mappingVertices: {
                value: function () {
                    var self = this;
                    var list = new nx.topology.common.FilterUniqueList();
                    list.monitorContaining(function (item) {
                        var resource = self.createVertexMapping(item);
                        return function () {
                            resource.release();
                        }
                    });
                    return list;
                }
            },
            mappingEdges: {
                value: function () {
                    var self = this;
                    var list = new nx.topology.common.FilterUniqueList();
                    list.monitorContaining(function (item) {
                        var resource = self.createEdgeMapping(item);
                        return function () {
                            resource.release();
                        }
                    });
                    return list;
                }
            },
            /**
             * A map contains pairs of status key and list.
             * A statusList is a list contains all entities or edges which matches the status definition.
             *
             * @type nx.Map
             * @property statusListMap
             */
            statusListMap: {
                dependencies: "vertices, edges",
                value: function (vertices, edges) {
                    return new nx.Map({
                        vertices: vertices,
                        edges: edges
                    });
                }
            },
            /**
             * A map contains pairs of status key and definition.
             *
             * @type nx.Map
             * @property statusDefinitionMap
             */
            statusDefinitionMap: {
                dependencies: "statusListMap",
                value: function (listmap) {
                    if (!listmap) {
                        return;
                    }
                    var self = this;
                    var map = new nx.Map();
                    map.monitor(function (key, conf) {
                        if (!conf.relation) {
                            throw "No relation defined";
                        }
                        var list, tmp = nx.List.calculate(conf.relation, listmap);
                        if (conf.filter) {
                            list = nx.List.select(tmp, conf.filter, conf.condition);
                            list.retain(tmp);
                        } else {
                            list = tmp;
                        }
                        listmap.set(key, list);
                        return function () {
                            if (list) {
                                listmap.remove(key);
                                list.release();
                                list = null;
                            }
                        };
                    });
                    return map;
                }
            }
        },
        methods: {
            init: function (data) {
                this.inherited();
                if (data) {
                    var vertices = nx.path(data, "vertices"),
                        edges = nx.path(data, "edges");
                    nx.each(vertices, function (vertex) {
                        this.vertices().push(this.createVertex(vertex))
                    }, this);
                    nx.each(edges, function (edge) {
                        this.edges().push(this.createEdge(edge));
                    }, this);
                }
            },
            /**
             * Create a Vertex object for further process, with same ID key at least.
             *
             * @method createVertex
             * @param data A Object with id and other data
             * @return nx.topology.model.Vertex Vertex
             */
            createVertex: function (data) {
                var vertex = new nx.topology.model.Vertex(),
                    id = nx.path(data, 'id');
                id = (id == null) ? nx.uuid() : id;
                vertex.id(id);
                vertex.originalData(data);
                return vertex;
            },
            /**
             * Create an Edge object for further process, which have a generated ID, and indicated Vertex object on source/target property at least.
             *
             * @method createEdge
             * @param data A Object with id and other data
             * @return nx.topology.model.Edge
             */
            createEdge: function (data) {
                var edge,
                    id = nx.path(data, 'id') || nx.uuid(),
                    sid = nx.path(data, 'source'),
                    tid = nx.path(data, 'target');
                var entitiesMap = this.entitiesMap(),
                    source = entitiesMap.get(sid),
                    target = entitiesMap.get(tid);
                if (!source || !target) {
                    return null;
                }
                edge = new nx.topology.model.Edge(data);
                edge.id(id);
                edge.originalData(data);
                edge.source(source);
                edge.target(target);
                return edge;
            },
            createVertexMapping: function (inOptions) {
                return Util.createMapping(this.vertices(), inOptions);
            },
            createEdgeMapping: function (inOptions) {
                return Util.createMapping(this.edges(), inOptions);
            }
        }
    });

}(nx, nx.global));
