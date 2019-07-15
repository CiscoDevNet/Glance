(function(nx) {

    var sin = Math.sin;
    var cos = Math.cos;
    var tan = Math.tan;
    var sqrt = Math.sqrt;
    var atan2 = Math.atan2;
    var square = nx.math.square;

    var EXPORT = nx.define("glance.model.BuildingModel", {
        properties: {
            id: null,
            position: [0, 0],
            // basic building arguments
            width: 0,
            depth: 1000,
            // building
            total: 0,
            whoami: null,
            onlines: null,
            floors: {
                value: function() {
                    var floors = new nx.List();
                    floors.retain(nx.List.mapeach(floors, {
                        "building": this,
                        "world": "building.world",
                        "+index": 1,
                        "number+": 1,
                        "whoami": "building.whoami",
                        "clients": nx.binding("id, building.clients", true, function(async, id, clients) {
                            if (clients) {
                                var list = nx.List.select(clients, "floorId", function(floorId) {
                                    return id === floorId;
                                });
                                async.set(list);
                                return list;
                            }
                        })
                    }));
                    return floors;
                }
            },
            floorMap: {
                dependencies: "floors",
                value: function(floors) {
                    if (floors) {
                        var map = new nx.Map();
                        map.retain(floors.monitorContaining(function(floor) {
                            return floor.watch("id", function(pname, id) {
                                map.set(id, floor);
                                return {
                                    release: function() {
                                        map.remove(id);
                                    }
                                };
                            })
                        }));
                        return map;
                    }
                }
            },
            clients: nx.binding("onlines, floors", true, function(async, onlines, floors) {
                if (onlines && floors) {
                    var map = new nx.Map();
                    var floorTerrains = nx.List.mapping(floors, "map.terrains", function(terrains) {
                        return terrains || new nx.List();
                    });
                    // FIXME nx.List.concatenate: to support 'undefined' result
                    var terrains = nx.List.concatenate(floorTerrains);
                    var clients = nx.List.concatenate([onlines, terrains]);
                    clients.retain(floorTerrains);
                    clients.retain(terrains);
                    async.set(clients);
                    return clients;
                }
            }),
            clientMap: {
                dependencies: "clients",
                async: true,
                value: function(async, clients) {
                    if (clients) {
                        var map = new nx.Map();
                        map.retain(clients.monitorContaining(function(client) {
                            return client.watch("id", function(pname, id) {
                                map.set(id, client);
                                return {
                                    release: function() {
                                        map.remove(id);
                                    }
                                };
                            })
                        }));
                        async.set(map);
                        return map;
                    }
                }
            },
            persons: nx.binding("whoami, clients", true, function(async, whoami, clients) {
                if (whoami && clients) {
                    var list = nx.List.select(clients, "category", function(category) {
                        // TODO process whoami
                        return category === "expert" || category === "guest";
                    });
                    async.set(list);
                    return list;
                }
            }),
            search: nx.binding("persons", true, function(async, persons) {
                var search = async.get() || async.set(new glance.model.SearchModel());
                search.items(persons);
            }),
            routeEntities: {
                dependencies: "clientMap, global.nx.util.hash.map",
                async: true,
                value: function(async, clientMap, map) {
                    var list = async.get() || async.set(new nx.List());
                    list.retain("cascade", clientMap && map && map.cascade("route", function(route) {
                        list.clear();
                        list.release("routeEntities");
                        if (!route) {
                            return;
                        }
                        var resources = new nx.Object();
                        route.split("/").map(function(aim, index) {
                            aim = aim.split(",");
                            var whoami, model, name, id, floorId, x, y;
                            if (aim.length === 1) {
                                // ID of target
                                whoami = this.whoami();
                                id = aim[0];
                                if (whoami && whoami.id() === id) {
                                    list.splice(index, 1, whoami);
                                } else {
                                    resources.retain(clientMap.cascade([id], function(model) {
                                        list.splice(index, 1, model);
                                    }));
                                }
                            } else {
                                // specified target: floorId,x,y,name
                                name = aim.slice(3).join(",");
                                floorId = aim[0];
                                x = aim[1] * 1;
                                y = aim[2] * 1;
                                list.splice(index, 1, new glance.model.ClientModel({
                                    id: nx.uuid(),
                                    floorId: floorId,
                                    position: [x, y]
                                }));
                            }
                        }.bind(this));
                        list.retain("routeEntities", resources);
                    }.bind(this)));
                    return list;
                }
            },
            routeSource: {
                dependencies: "routeEntities",
                async: true,
                value: function(async, routeEntities) {
                    return routeEntities && routeEntities.on("diff", function() {
                        async.set(routeEntities.get(0));
                    });
                }
            },
            routeTarget: {
                dependencies: "routeEntities",
                async: true,
                value: function(async, routeEntities) {
                    return routeEntities && routeEntities.on("diff", function() {
                        async.set(routeEntities.get(1));
                    });
                },
                watcher: function(pname, pvalue, poldvalue) {
                    poldvalue && poldvalue.isroute(false);
                    pvalue && pvalue.isroute(true);
                }
            },
            route: {
                dependencies: "whoami.category, routeTarget.name, routeSource.floorId, routeSource.position, routeTarget.floorId, routeTarget.position",
                async: true,
                value: function(async, category, name, routeSourceFloorId, routeSourcePosition, routeTargetFloorId, routeTargetPosition) {
                    if (category === "screen" && routeSourceFloorId && routeSourcePosition && routeTargetFloorId && routeTargetPosition) {
                        var route = new glance.model.RouteModel(this, routeSourceFloorId, routeSourcePosition, routeTargetFloorId, routeTargetPosition);
                        route.title(name || "Select");
                        async.set(route);
                        return route;
                    } else {
                        async.set(null);
                    }
                }
            }
        },
        methods: {
            init: function(options) {
                this.inherited();
                if (options) {
                    this.id(options.id || nx.uuid());
                    this.width(options.width || 0);
                    this.depth(options.depth || 0);
                }
            },
            setClientPosition: function(pid, fid, position) {
                var floorMap = this.floorMap();
                var clientMap = this.clientMap();
                var floor, client = clientMap.get(pid);
                if (client) {
                    if (fid === client.floorId()) {
                        floor = floorMap.get(fid);
                        floor.setClientPosition(client, position);
                    } else {
                        client.floorId(fid);
                        client.position(position);
                    }
                }
            }
        }
    });
})(nx);
