(function(nx) {
    var EXPORT = nx.define("glance.model.RouteModel", {
        properties: {
            building: null,
            title: null,
            source: null,
            target: null,
            floorInfos: {
                dependencies: "building.floors",
                value: function(floors) {
                    if (floors) {
                        var infos = nx.List.mapeach(floors, "floor");
                        return infos;
                    }
                }
            },
            sourceFloorInfo: {
                dependencies: "source.floorId, floorInfos",
                async: true,
                value: function(property, id, floorInfos) {
                    this.release("sourceFloorInfo");
                    if (id && floorInfos) {
                        var infoList = nx.List.select(floorInfos, "floor.id", function(fid) {
                            return fid === id;
                        });
                        infoList.retain(infoList.monitorContaining(function(info) {
                            property.set(info);
                            return function() {
                                property.set(null);
                            };
                        }));
                        this.retain("sourceFloorInfo", infoList);
                    }
                }
            },
            targetFloorInfo: {
                dependencies: "target.floorId, floorInfos",
                async: true,
                value: function(property, id, floorInfos) {
                    this.release("targetFloorInfo");
                    if (id && floorInfos) {
                        var infoList = nx.List.select(floorInfos, "floor.id", function(fid) {
                            return fid === id;
                        });
                        infoList.retain(infoList.monitorContaining(function(info) {
                            property.set(info);
                            return function() {
                                property.set(null);
                            };
                        }));
                        this.retain("targetFloorInfo", infoList);
                    }
                }
            },
            liftGroups: {
                dependencies: "source.position, target.position, sourceFloorInfo.floor.map.entrances, targetFloorInfo.floor.map.entrances",
                value: function(sourcePosition, targetPosition, sourceEntrances, targetEntrances) {
                    if (sourcePosition && targetPosition && sourceEntrances && targetEntrances) {
                        var position = [sourcePosition[0] / 2 + targetPosition[0] / 2, sourcePosition[1] / 2 + targetPosition[1] / 2];
                        var entrances = sourceEntrances.data().slice();
                        entrances = entrances.filter(function(entrance) {
                            return !!targetEntrances.find(function(e) {
                                return e.group() === entrance.group();
                            });
                        });
                        entrances.sort(function(e1, e2) {
                            var p1, p2;
                            p1 = e1.position(), p2 = e2.position();
                            return nx.geometry.Line.getDistance(p1[0], p1[1], position[0], position[1]) - nx.geometry.Line.getDistance(p2[0], p2[1], position[0], position[1]);
                        });
                        return new nx.List(entrances.map(function(entrance) {
                            return entrance.group();
                        }));
                    }
                }
            },
            selection: 0,
            routes: {
                value: nx.binding("floorInfos, source.floorId, target.floorId, source.position, target.position", function(floorInfos, sid, tid, sourcePosition, targetPosition) {
                    if (floorInfos && sid && tid && sourcePosition && targetPosition) {
                        if (sid === tid) {
                            var floorInfo = floorInfos.find(function(floorInfo) {
                                return floorInfo.floor().id() === sid;
                            });
                            return new nx.List([
                                new nx.List([new EXPORT.FloorRouteSegmentModel(floorInfo, sourcePosition, targetPosition)])
                            ]);
                        } else {
                            return nx.binding("liftGroups", function(liftGroups) {
                                this.release("routes");
                                if (liftGroups) {
                                    var sourceFloorInfo = nx.path(this, "sourceFloorInfo");
                                    var targetFloorInfo = nx.path(this, "targetFloorInfo");
                                    var sourcePosition = nx.path(this, "source.position");
                                    var targetPosition = nx.path(this, "target.position");
                                    var routes = nx.List.mapping(liftGroups, function(gid) {
                                        var list = new nx.List();
                                        var sourceFloor = sourceFloorInfo.floor();
                                        var targetFloor = targetFloorInfo.floor();
                                        var sourceLiftPosition = EXPORT.getPositionByLiftGroup(sourceFloor, gid);
                                        var targetLiftPosition = EXPORT.getPositionByLiftGroup(targetFloor, gid);
                                        list.push(new EXPORT.FloorRouteSegmentModel(sourceFloorInfo, sourcePosition, sourceLiftPosition));
                                        list.push(new EXPORT.LiftRouteSegmentModel(sourceFloorInfo, targetFloorInfo, gid));
                                        list.push(new EXPORT.FloorRouteSegmentModel(targetFloorInfo, targetLiftPosition, targetPosition));
                                        return list;
                                    });
                                    this.retain("routes", routes);
                                    return routes;
                                }
                            });
                        }
                    }
                })
            },
            selected: {
                dependencies: "selection, routes",
                value: function(selection, routes) {
                    if (routes) {
                        selection = selection || 0;
                        selection = Math.min(selection, routes.length() - 1);
                        selection = Math.max(selection, 0);
                        return routes.get(selection);
                    }
                }
            },
            routeDetails: {
                dependencies: "routes",
                async: true,
                value: function(async, routes) {
                    if (routes) {
                        var list = nx.List.mapeach(routes, "route", {
                            "segments": nx.binding("route", true, function(async, route) {
                                var segments = route && nx.List.mapeach(route, "segment", {
                                    "distance": nx.binding("segment, segment.points.length", function(segment, length) {
                                        if (nx.is(segment, glance.model.RouteModel.FloorRouteSegmentModel)) {
                                            return length;
                                        } else {
                                            return 40;
                                        }
                                    }),
                                    "+elapsed": nx.binding("distance"),
                                    "time": nx.binding("elapsed", EXPORT.getTimeByDistance),
                                    "title": nx.binding("index", true, function(async, index) {
                                        if (index >= 0) {
                                            var segment = route.get(index);
                                            if (nx.is(segment, glance.model.RouteModel.FloorRouteSegmentModel)) {
                                                return nx.Object.cascade(segment, "floorInfo.floor.map", function(map) {
                                                    var title, targetPosition, sourceIndex, targetIndex, entrance;
                                                    if (map) {
                                                        targetPosition = segment.target();
                                                        nx.each(map.entrances(), function(entrance) {
                                                            var position = entrance.position();
                                                            if (position[0] === targetPosition[0] && position[1] === targetPosition[1]) {
                                                                title = "Walk to " + entrance.category();
                                                            }
                                                        });
                                                        nx.each(map.terrains(), function(terrain) {
                                                            if (terrain.position[0] === targetPosition[0] && terrain.position[1] === targetPosition[1]) {
                                                                title = "Walk to " + terrain.id;
                                                            }
                                                        });
                                                        return async.set(title || "Walk along the route");
                                                    }
                                                });
                                            } else {
                                                return nx.Object.cascade(segment, "targetFloorInfo.floor.map.entrance", function(entrances) {
                                                    var sourceIndex = nx.path(segment, "sourceFloorInfo.index");
                                                    var targetIndex = nx.path(segment, "targetFloorInfo.index");
                                                    var entrance, title;
                                                    entrance = nx.path(segment, "targetFloorInfo.floor.map.entrances").find(function(entrance) {
                                                        return entrance.group() === segment.group();
                                                    });
                                                    title = [(sourceIndex > targetIndex ? "Down" : "Up"), "to floor", (targetIndex + 1), "by", entrance.category()].join(" ");
                                                    return async.set(title || "Walk along the route");
                                                });
                                            }
                                        }
                                    })
                                });
                                async.set(segments);
                                return segments;
                            }),
                            "title": nx.binding("route, index", function(route, index) {
                                if (nx.path(route, "length") >= 1 && index >= 0) {
                                    var title = ["<strong>Route ", (index + 1), "</strong>"].join(" ");
                                    var segment = route.get(1);
                                    if (segment) {
                                        entrance = nx.path(segment, "targetFloorInfo.floor.map.entrances").find(function(entrance) {
                                            return entrance.group() === segment.group();
                                        });
                                        if (entrance) {
                                            title += "by " + entrance.category();
                                        }
                                    }
                                    return title;
                                }
                            }),
                            "distance": nx.binding("segments", true, function(async, segments) {
                                if (segments) {
                                    var distances = nx.List.mapping(segments, "distance");
                                    distances.retain(nx.List.summarize(distances, function(sum) {
                                        async.set(sum);
                                    }));
                                    return distances;
                                }
                            }),
                            "time": nx.binding("distance", EXPORT.getTimeByDistance)
                        });
                        async.set(list);
                        return list;
                    }
                }
            }
        },
        methods: {
            init: function(building, f1, p1, f2, p2) {
                this.inherited();
                this.building(building);
                this.source({
                    floorId: f1,
                    position: p1
                });
                this.target({
                    floorId: f2,
                    position: p2
                });
            }
        },
        statics: {
            getPositionByLiftGroup: function(floor, gid) {
                var entrance = floor.map().entrances().find(function(entrance) {
                    return entrance.group() === gid;
                });
                return entrance && entrance.position();
            },
            LiftRouteSegmentModel: nx.define({
                properties: {
                    sourceFloorInfo: null,
                    targetFloorInfo: null,
                    group: null,
                    points: {
                        dependencies: "sourceFloorInfo.index, sourceFloorInfo.floor, targetFloorInfo.index, targetFloorInfo.floor, group",
                        value: function(sourceIndex, sourceFloor, targetIndex, targetFloor, group) {
                            if (sourceIndex >= 0 && targetIndex >= 0 && sourceFloor && targetFloor && group) {
                                var sourcePosition = EXPORT.getPositionByLiftGroup(sourceFloor, group).slice();
                                var targetPosition = EXPORT.getPositionByLiftGroup(targetFloor, group).slice();
                                sourcePosition.push(sourceIndex);
                                targetPosition.push(targetIndex);
                                return [sourcePosition, targetPosition];
                            }
                            return null;
                        }
                    }
                },
                methods: {
                    init: function(sourceFloorInfo, targetFloorInfo, group) {
                        this.inherited();
                        this.sourceFloorInfo(sourceFloorInfo);
                        this.targetFloorInfo(targetFloorInfo);
                        this.group(group);
                    }
                }
            }),
            FloorRouteSegmentModel: nx.define({
                properties: {
                    floorInfo: null,
                    source: null,
                    target: null,
                    points: {
                        dependencies: "floorInfo.floor.router, source, target",
                        async: true,
                        value: function(property, router, source, target) {
                            this.release("points");
                            if (router && source && target) {
                                this.retain("points", router.getRoute(source, target, function(path) {
                                    property.set(path);
                                }));
                            }
                        }
                    }
                },
                methods: {
                    init: function(floorInfo, source, target) {
                        this.inherited();
                        this.floorInfo(floorInfo);
                        this.source(source);
                        this.target(target);
                    }
                }
            })
        }
    });
})(nx);
