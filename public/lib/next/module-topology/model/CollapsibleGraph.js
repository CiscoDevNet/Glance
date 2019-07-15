/// require util
/// require bean
/// require Graph

(function (nx, global) {

    var Util = nx.path(nx.global, "nx.topology.common.Util");

    /**
     * A graph which supporting collapse/expand by Union.
     *
     * @class CollapsibleGraph
     * @extends nx.topology.model.Graph
     * @namespace nx.topology.model
     * @constructor
     * @param data Initalize data of the graph.
     */
    var EXPORT = nx.define('nx.topology.model.CollapsibleGraph', nx.topology.model.Graph, {
        properties: {
            /**
             * A map to get parent union of any vertex/union by ID.
             *
             * @type nx.Map
             * @property entitiesParentMap
             * @private
             */
            entitiesParentMap: {
                value: function () {
                    return new nx.Map();
                }
            },
            /**
             * List of unions.
             *
             * @type nx.List
             * @property unions
             */
            unions: {
                dependencies: "vertices, entitiesMap, entitiesParentMap, statusListMap",
                value: function (vertices, map, pmap, listmap) {
                    if (!map || !pmap || !listmap) {
                        return;
                    }
                    var list = new nx.topology.common.FilterUniqueList();
                    list.filters().push(Util.getTypeFilter(nx.topology.model.Union));
                    list.filters().push(Util.getIdFilter(map));
                    list.filters().push(function (item) {
                        item.entities().each(function (child) {
                            var parent = pmap.get(child.id());
                            if (parent && parent !== item) {
                                throw new Error("Failed adding union " + item.id() + " which containing child " + child.id() + " belongs to some other union.");
                            }
                        });
                        return true;
                    });
                    list.monitorContaining(Util.getIdMappingMonitor(map));
                    list.monitorContaining(EXPORT.privates.unionLeafWatcher);
                    list.monitorContaining(EXPORT.privates.unionEdgeWatcher);
                    list.monitorContaining(EXPORT.privates.unionVisibleWatcher);
                    // update parent map
                    var detach = function (item) {
                        var parent = pmap.get(item.id());
                        if (parent) {
                            parent.entities().remove(item);
                        }
                    };
                    vertices.monitorContaining(function (vertex) {
                        return function () {
                            detach(vertex);
                        };
                    });
                    list.monitorContaining(function (union) {
                        var res = union.entities().monitorContaining(function (item) {
                            var lastparent = pmap.get(item.id());
                            if (lastparent && lastparent !== union) {
                                lastparent.entities().remove(item);
                            }
                            pmap.set(item.id(), union);
                            return function () {
                                pmap.remove(item.id());
                            };
                        });
                        return function () {
                            res.release();
                            detach(union);
                        };
                    });
                    // add to status map
                    listmap.set("unions", list);
                    return list;
                }
            },
            /**
             * Top level entities.
             * Top level directly contained in graph, not contained in a union.
             *
             * @type nx.topology.common.FilterUniqueList
             * @property entitiesTopLevel
             * @private
             */
            entitiesTopLevel: {
                dependencies: "vertices, unions",
                value: function (vertices, unions) {
                    if (!vertices || !unions) {
                        return;
                    }
                    var list = new nx.topology.common.FilterUniqueList();
                    //watch vertices
                    vertices.monitorContaining(Util.getListSyncMonitor(list));
                    //watch unions
                    unions.monitorContaining(function (item) {
                        //add
                        var res = item.entities().monitorContaining(Util.getListSyncMonitor(list, false));
                        list.push(item);
                        //remove
                        return function () {
                            list.remove(item);
                            res.release();
                        };
                    });
                    return list;
                }
            },
            /**
             * All entities which are not hidden by collapse.
             *
             * @type nx.topology.common.FilterUniqueList
             * @property entitiesVisible
             * @readOnly
             */
            entitiesVisible: {
                dependencies: "entitiesMap, entitiesTopLevel",
                value: function (map, tlist) {
                    if (!map || !tlist) {
                        return;
                    }
                    var vlist = new nx.topology.common.FilterUniqueList();
                    tlist.monitorContaining(function (item) {
                        var watcher;
                        vlist.push(item);
                        if (nx.is(item, nx.topology.model.Union)) {
                            watcher = Util.monitorOnCondition(item.entitiesVisible(), {
                                target: item,
                                property: "collapse",
                                monitorByFalse: Util.getListSyncMonitor(vlist),
                                monitorByTrue: function (i) {
                                    vlist.remove(i);
                                }
                            });
                        }
                        return function () {
                            if (watcher) {
                                watcher.release();
                            }
                            if (!map.get(item.id())) {
                                vlist.remove(item);
                            }
                        };
                    });
                    return vlist;
                }
            },
            /**
             * List of connections.
             *
             * @type nx.List
             * @property unions
             */
            connections: {
                dependencies: "entitiesVisible",
                value: function (entitiesVisible) {
                    if (!entitiesVisible) {
                        return;
                    }
                    var list = new nx.topology.common.FilterUniqueList();
                    var vStarList = new nx.topology.common.FilterUniqueList();
                    entitiesVisible.monitorContaining(function (gVertex) {
                        if (nx.is(gVertex, nx.topology.model.Union)) {
                            var gWatcher = gVertex.watch('collapse', function (pn, pv) {
                                vStarList.toggle(gVertex, pv);
                            });
                            return function () {
                                gWatcher.release();
                            }
                        } else {
                            vStarList.push(gVertex);
                            return function () {
                                vStarList.remove(gVertex);
                            };
                        }
                    });
                    var esmgr = {
                        isContained: function (v1, v2) {
                            return v1.entitiesVisible && v1.entitiesVisible().contains(v2);
                        },
                        getRelated: function (vstar, edge) {
                            var vertex;
                            vStarList.each(function (v) {
                                if (v !== vstar && v.edges().contains(edge)) {
                                    // FIXME low performance, maybe wrong logic
                                    if (esmgr.isContained(v, vstar) || esmgr.isContained(vstar, v)) {
                                        return;
                                    }
                                    vertex = v;
                                    return false;
                                }
                            });
                            return vertex;
                        },
                        map: {},
                        cache: {},
                        clear: function (source, target) {
                            var temp, sourceMap;
                            if (EXPORT.privates.compare(source, target)) {
                                temp = target, target = source, source = temp;
                            }
                            sourceMap = esmgr.map[source];
                            if (sourceMap) {
                                var es = sourceMap[target];
                                if (es) {
                                    var scache = esmgr.cache[source];
                                    var tcache = esmgr.cache[target];
                                    scache.splice(scache.indexOf(es), 1);
                                    tcache.splice(tcache.indexOf(es), 1);
                                }
                                delete sourceMap[target];
                            }
                        },
                        set: function (source, target, connection) {
                            var temp, sourceMap;
                            if (EXPORT.privates.compare(source, target)) {
                                temp = target, target = source, source = temp;
                            }
                            sourceMap = esmgr.map[source] = esmgr.map[source] || {};
                            sourceMap[target] = connection;
                            var cache = esmgr.cache;
                            (cache[source] = cache[source] || []).push(connection);
                            (cache[target] = cache[target] || []).push(connection);
                        },
                        get: function (source, target) {
                            var temp, sourceMap;
                            if (EXPORT.privates.compare(source, target)) {
                                temp = target, target = source, source = temp;
                            }
                            sourceMap = esmgr.map[source];
                            return sourceMap && sourceMap[target];
                        }
                    };
                    vStarList.monitorContaining(function (vstar) {
                        var res = vstar.edges().monitorContaining(function (edge) {
                            var vertex = esmgr.getRelated(vstar, edge);
                            if (vertex) {
                                var sid = vstar.id();
                                var tid = vertex.id();
                                var es = esmgr.get(sid, tid);
                                if (!es) {
                                    es = new nx.topology.model.Connection();
                                    es.source(vstar);
                                    es.target(vertex);
                                    esmgr.set(sid, tid, es);
                                    list.push(es);
                                }
                                es.edges().push(edge);
                                return function () {
                                    es.edges().remove(edge);
                                    if (es.edges().length() === 0) {
                                        list.remove(es);
                                        esmgr.clear(sid, tid);
                                    }
                                };
                            }
                        });
                        return function () {
                            var i, es, cache = esmgr.cache[vstar.id()];
                            if (cache) {
                                for (i = cache.length - 1; i >= 0; i--) {
                                    es = cache[i];
                                    list.remove(es);
                                    esmgr.clear(es.source().id(), es.target().id());
                                }
                            }
                            res.release();
                        };
                    });
                    return list;
                }
            },
            mappingUnions: {
                value: function () {
                    var self = this;
                    var list = new nx.topology.common.FilterUniqueList();
                    list.monitorContaining(function (item) {
                        var resource = self.createUnionMapping(item);
                        return function () {
                            resource.release();
                        }
                    });
                    return list;
                }
            }
        },
        methods: {
            init: function (data) {
                this.inherited(data);
                // initialize default relation map
                this.statusListMap().set("unions", this.unions());
                // initialize data
                var i, lenmark, vs, unions = (nx.path(data, "unions") || []).slice();
                do {
                    lenmark = unions.length;
                    for (i = unions.length - 1; i >= 0; i--) {
                        if (vs = this.createUnion(unions[i])) {
                            this.unions().push(vs);
                            unions.splice(i, 1);
                        }
                    }
                } while (unions.length && unions.length !== lenmark);
            },
            /**
             * Create a union.
             * 
             * @method createUnion
             * @param data The data of the union
             * @return a union created by the data.
             */
            createUnion: function (inData) {
                var union = new nx.topology.model.Union();
                var id, rootId, vertexRoot;
                var vertexIds, vertices;
                id = nx.path(inData, 'id');
                rootId = nx.path(inData, 'root');
                vertexIds = nx.path(inData, 'entities') || [];
                vertexRoot = this.entitiesMap().get(rootId);
                vertices = Util.getValuesByIds(this.entitiesMap(), vertexIds);
                // contain itself
                if (vertexIds.indexOf(id) > -1) {
                    return null;
                }
                if (!vertices) {
                    return null;
                }
                union.id(id);
                union.collapse(inData.collapse);
                union.originalData(inData);
                union.vertexRoot(vertexRoot);
                union.entities().push.apply(union.entities(), vertices);
                return union;
            }
        },
        statics: {
            privates: {
                compare: function (source, target) {
                    // TODO Make sure different type of value can be compared
                    return source > target;
                },
                unionLeafWatcher: function (union) {
                    var list = union.vertices();
                    var res = union.entities().monitorContaining(function (item) {
                        if (!nx.is(item, nx.topology.model.Union)) {
                            list.push(item);
                            return function () {
                                list.remove(item);
                            };
                        } else {
                            var res = item.vertices().monitorContaining(Util.getListSyncMonitor(list));
                            return function () {
                                res.release();
                            };
                        }
                    });
                    return function () {
                        res.release();
                    };
                },
                unionEdgeWatcher: function (union) {
                    var list = union.edges();
                    var res = union.entities().monitorContaining(function (item) {
                        var res = item.edges().monitorContaining(function (edgeItem) {
                            list.toggle(edgeItem);
                            return function () {
                                list.toggle(edgeItem);
                            };
                        });
                        return function () {
                            res.release();
                        };
                    });
                    return function () {
                        res.release();
                    };
                },
                unionVisibleWatcher: function (union) {
                    var list = union.entitiesVisible();
                    // visible list
                    var res = union.entities().monitorContaining(function (item) {
                        list.push(item);
                        var watcher;
                        if (nx.is(item, nx.topology.model.Union)) {
                            watcher = Util.monitorOnCondition(item.entities(), {
                                target: item,
                                property: "collapse",
                                monitorByFalse: Util.getListSyncMonitor(list),
                                monitorByTrue: function (i) {
                                    list.remove(i);
                                }
                            });
                        }
                        return function () {
                            if (watcher) {
                                watcher.release();
                            }
                            list.remove(item);
                        };
                    });
                    return function () {
                        res.release();
                    };
                },
                createUnionMapping: function (inOptions) {
                    return Util.createMapping(this.unions(), inOptions);
                }
            }
        }
    });

}(nx, nx.global));
