(function(nx) {

    var MapLoader = glance.model.map.MapLoader;
    var WorldModel = glance.model.WorldModel;

    var EXPORT = nx.define("glance.perspective.Window", nx.lib.DefaultApplication, {
        view: {
            cssclass: "glance perspective masked",
            content: [{
                name: "world",
                type: "glance.perspective.World",
                properties: {
                    model: "{worldModel}"
                },
                events: {
                    paint: function() {
                        this.removeClass("masked");
                    }
                }
            }, {
                //loadingPage
                name: "mask",
                cssclass: "mask",
                type: "nx.ui.Element",
                content: [{
                    cssclass: "loading-logo",
                    type: "glance.common.BrandGlance"
                }, {
                    cssclass: "loading-circle",
                    type: "glance.common.LoadingCircle"
                }]
            }]
        },
        properties: {
            registered: function() {
                return new nx.List();
            },
            onlines: {
                dependencies: "registered",
                async: true,
                value: function(async, registered) {
                    if (registered) {
                        var onlines = nx.List.select(registered, "online");
                        async.set(onlines);
                        return onlines;
                    }
                }
            },
            worldModel: nx.binding("onlines", function(onlines) {
                var model = new glance.model.WorldModel();
                model.onlines(onlines);
                return model;
            }),
            densityData: function(value) {
                return value;
            },
            heatmapAjax: nx.binding("worldModel,densityData", function(worldModel, densityData) {
                if (worldModel) {
                    if (!densityData) {
                        return;
                    }
                    var density = [];
                    for (var i = 0; i < densityData.data.density.length; i++) {
                        if (densityData.data.density[i].length > 0) {
                            for (var j = 0; j < densityData.data.density[i].length; j++) {
                                density.push(densityData.data.density[i][j]);
                            }
                        }
                    }
                    var bm = worldModel.buildingMap().get(densityData.data.buildingId);
                    var fm = bm.floorMap().get(densityData.data.floorId);
                    fm.density(density);
                }
            }),
            service: nx.binding("worldModel", function(worldModel) {
                if (worldModel) {
                    var service = new glance.service.Service();
                    service.retain(service.on("message", function(sender, data) {
                        var model;
                        if (data.uiConfig) {
                            model = worldModel.uiConfig(worldModel.uiConfig() || (new nx.Object()));
                            nx.each(data.uiConfig, function(value, key) {
                                nx.Object.extendProperty(model, key, {
                                    value: value
                                }, true);
                            });
                        }
                        if (data.campus) {
                            this.updateModelByCampus(data.campus);
                        }
                        if (data.register) {
                            // TODO
                            nx.each(data.register, function(item) {
                                this.getRegistedClient(item);
                            }.bind(this));
                        }
                        if (data.total >= 0) {
                            this.worldModel().total(data.total);
                        }
                        if (data.whoami) {
                            item = data.whoami;
                            model = this.getRegistedClient(item);
                            model.online(true);
                            model.isme(true);
                            this.worldModel().whoami(model);
                        }
                        if (data.join) {
                            nx.each(data.join, function(item) {
                                var model = this.getRegistedClient(item);
                                model.online(true);
                            }.bind(this));
                        }
                        if (data.withdraw) {
                            nx.each(data.withdraw, function(item) {
                                var model = this.getRegistedClient(item, false);
                                model && model.online(false);
                            }.bind(this));
                        }
                        if (data.movement) {
                            nx.each(data.movement, function(item) {
                                this.worldModel().setClientPosition(item.id, item.buildingId, item.floorId, item.position);
                            }.bind(this));
                        }
                        if (data.highlight && data.highlight.length) {
                            nx.each(this.registered(), function(client) {
                                client.active(data.highlight.indexOf(client.id()) >= 0)
                            });
                        }
                        if (data.control) {
                            nx.each(data.control, function(command) {
                                switch (command) {
                                    case "show-heatmap":
                                        this.worldModel().showHeatmap(true);
                                        break;
                                    case "hide-heatmap":
                                        this.worldModel().showHeatmap(false)
                                        break;
                                    case "show-top-view":
                                        this.worldModel().cameraSlop(WorldModel.SLOP_MAX);
                                        this.worldModel().cameraRotation(0);
                                        this.worldModel().disablePerspective(true);
                                        break;
                                    case "show-3d-view":
                                        this.worldModel().cameraSlop(WorldModel.SLOP_DEFAULT);
                                        this.worldModel().disablePerspective(false);
                                        break;
                                    case "show-larger-icon":
                                        this.worldModel().iconSizeLevel(Math.min(1.5, this.worldModel().iconSizeLevel() + 0.25));
                                        break;
                                    case "show-smaller-icon":
                                        this.worldModel().iconSizeLevel(Math.max(0.5, this.worldModel().iconSizeLevel() - 0.25));
                                        break;
                                    case "show-zone":
                                        this.worldModel().showZone(true);
                                        break;
                                    case "hide-zone":
                                        this.worldModel().showZone(false);
                                        break;
                                    case "show-person":
                                        this.worldModel().showPerson(true);
                                        break;
                                    case "hide-person":
                                        this.worldModel().showPerson(false);
                                        break;
                                    case "show-facility":
                                        this.worldModel().showFacility(true);
                                        break;
                                    case "hide-facility":
                                        this.worldModel().showFacility(false);
                                        break;
                                }
                            }.bind(this));
                        }
                        if (data.avatar && data.avatar.length) {
                            nx.each(data.avatar, function(id) {
                                var client = this.registered().find(function(client) {
                                    return client.id() === id;
                                });
                                client && client.avatarVersion(Date.now());
                            }.bind(this));
                        }
                        if (data.zones) {
                            for (floorId in data.zones) {
                                nx.each(data.zones[floorId], function(item, zoneId) {
                                    var client = this.onlines().find(function(client) {
                                        return client.id() === zoneId;
                                    });
                                    if (client) {
                                        client.count(item.zoneCount);
                                        client.showLabel(item.showLabel !== false);
                                    }
                                }.bind(this));
                            }
                        }
                    }.bind(this)));
                    return service;
                }
            })
        },
        methods: {
            init: function() {
                this.inherited();
                // check if demo
                var service = this.service();
                if (!nx.path(nx.global, "nx.util.url.search.DEMO")) {
                    service.autoconnect(true);
                } else {
                    glance.perspective.DEMO.run(this, service);
                }
                //send message to backend
                this.retain(nx.Object.cascade(this, "worldModel.id,worldModel.building,worldModel.viewLevelActual,worldModel.showHeatmap",
                    function(campusId, building, floor, isShow) {
                        this.release("sendDataTimer");
                        if (!campusId || !building || Math.round(floor) !== floor || !isShow) {
                            return;
                        }
                        var timerResources = new nx.Object();
                        timerResources.retain(nx.timer(0, function(again) {
                            timerResources.retain("sendDataAjax", nx.util.ajax({
                                url: glance.service.api.getHeatmapUrl() + "?buildingId=" + building.id() + "&floorId=" + building.floors().data()[floor].id() + "&rowCount=50&columnCount=100",
                                success: function(resources, data) {
                                    this.densityData(data);
                                }.bind(this),
                                error: function() {
                                    if (nx.path(nx.global, "nx.util.url.search.DEMO")) {
                                        this.densityData(glance.perspective.DEMO.heatmap);
                                    }
                                }.bind(this),
                                complete: function() {
                                    again(30000);
                                }
                            }));
                        }.bind(this)));
                        this.retain("sendDataTimer", timerResources);
                    }.bind(this)));
            },
            getRegistedClient: function(item, createIfMissing) {
                // update item
                item = nx.extend({}, item);
                // get registered
                var model = this.registered().find(function(model) {
                    return model.id() === item.id;
                });
                if (!model) {
                    if (createIfMissing !== false) {
                        // register the item
                        model = new glance.model.ClientModel(item);
                        this.registered().push(model);
                    }
                } else {
                    nx.sets(model, item);
                }
                return model;
            },
            getGlobalFontSizeByPageSize: function(size) {
                return Math.min(size.width / 1440, size.height / 1440) * 30;
            },
            updateModelByCampus: function(cdata) {
                var model = this.worldModel();
                model.id(cdata.campusId);
                nx.each(cdata.buildings, function(bdata) {
                    var bmodel = new glance.model.BuildingModel();
                    bmodel.floors().clear();
                    nx.sets(bmodel, {
                        id: bdata.buildingId,
                        position: bdata.position,
                        width: bdata.width,
                        depth: bdata.depth
                    });
                    nx.each(bdata.floors, function(fdata) {
                        var fmodel = new glance.model.FloorModel();
                        var urlMap, urlMask;
                        urlMap = "map/" + fdata.mapName + ".svg";
                        urlMask = "map/" + fdata.mapName + "-mask-quarter.png";
                        fmodel.id(fdata.floorId);
                        fmodel.name(fdata.floorName);
                        if (fdata.zones) {
                            nx.each(fdata.zones, function(zone) {
                                if (zone.zoneCoordinate && zone.zoneCoordinate.length > 2) {
                                    model.onlines().push(EXPORT.getZoneClientByZoneData(bdata.buildingId, fdata.floorId, zone));
                                }
                                if (zone.zoneCoordinate && zone.zoneCoordinate.length > 2) {
                                    model.onlines().push(EXPORT.getNonStandardizedZoneClient(bdata.buildingId, fdata.floorId, zone));
                                }
                            });
                        }
                        if (fdata.facilities) {
                            nx.each(fdata.facilities, function(facility) {
                                if (facility && facility.imagePath && (facility.position || facility.facilityCoordinate.length > 0)) {
                                    model.onlines().push(EXPORT.getFacilityClientByFacilityData(bdata.buildingId, fdata.floorId, facility));
                                }
                            });
                        }
                        fmodel.retain("loadMap", MapLoader.loadAndInit(bdata.buildingId, fdata.floorId, urlMask, urlMap, function(map) {
                            fmodel.map(map);
                        }));
                        bmodel.floors().push(fmodel);
                    });
                    model.buildings().push(bmodel);
                });
                if (!model.building() && model.buildings().length()) {
                    model.building(model.buildings().get(0));
                }
            }
        },
        statics: {
            ZONE_COLOR_PICK: 0,
            ZONE_COLORS: [
                [158, 0, 93, .77],
                [247, 147, 30, .77],
                [193, 39, 45, .77],
                [217, 224, 33, .77],
                [26, 211, 122, .77]
            ],
            getZoneClientByZoneData: function(buildingId, floorId, data) {
                var points = data.zoneCoordinate.map(function(coordinate) {
                    return [coordinate.x, coordinate.y];
                });
                var info = MapLoader.getShapeInfoByPolygonPoints(points);
                var color;
                if (data.color) {
                    color = nx.util.cssstyle.toRgbaArray(data.color);
                } else {
                    color = EXPORT.ZONE_COLORS[(EXPORT.ZONE_COLOR_PICK++) % EXPORT.ZONE_COLORS.length]
                }
                var client = new glance.model.ClientModel({
                    online: true,
                    category: "zone",
                    id: data.id || [buildingId, floorId, data.name].join(":"),
                    name: data.name,
                    shape: info.shape,
                    buildingId: buildingId,
                    floorId: floorId,
                    position: info.position || data.position,
                    color: color
                });
                return client;
            },
            //test labeling for non-standardized shapes
            getNonStandardizedZoneClient: function(buildingId, floorId, data) {
                var points = data.zoneCoordinate.map(function(coordinate) {
                    return [coordinate.x, coordinate.y];
                });
                var info = MapLoader.getShapeInfoByPolygonPoints(points);

                var color;
                if (data.color) {
                    color = nx.util.cssstyle.toRgbaArray(data.color);
                } else {
                    color = EXPORT.ZONE_COLORS[(EXPORT.ZONE_COLOR_PICK++) % EXPORT.ZONE_COLORS.length]
                }
                var client = new glance.model.ClientModel({
                    online: true,
                    category: "zone",
                    id: data.id || [buildingId, floorId, data.name].join(":"),
                    name: "Zone East",
                    shape: info.shape,
                    buildingId: buildingId,
                    floorId: floorId,
                    position: [5630, 1750],
                    color: color
                });
                return client;
            },
            getFacilityClientByFacilityData: function(buildingId, floorId, data) {
                var points, info, position, shape, color;
                if (data.facilityCoordinate) {
                    points = data.facilityCoordinate.map(function(coordinate) {
                        return [coordinate.x, coordinate.y];
                    });
                    if (points.length > 2) {
                        info = MapLoader.getShapeInfoByPolygonPoints(points);
                        position = info.position;
                        shape = info.shape;
                    } else {
                        position = points[0];
                        shape = null;
                    }
                }
                if (data.position) {
                    position = data.position;
                }
                if (data.color) {
                    color = nx.util.cssstyle.toRgbaArray(data.color);
                } else {
                    color = EXPORT.ZONE_COLORS[(EXPORT.ZONE_COLOR_PICK++) % EXPORT.ZONE_COLORS.length]
                }
                var client = new glance.model.ClientModel({
                    online: true,
                    category: "facility",
                    id: data.id || [buildingId, floorId, data.name].join(":"),
                    name: data.displayName,
                    shape: shape,
                    buildingId: buildingId,
                    floorId: floorId,
                    imagePath: data.imagePath,
                    position: position,
                    color: color
                });
                return client;
            },
            CSS: nx.util.csssheet.create({
                ":focus": {
                    "outline": "0"
                },
                ".glance.perspective": {
                    "nx:fixed": "0",
                    "font-family": "CiscoSans",
                    "font-weight": "200",
                    // "background-image": "url(glance/bg.png)",
                    "background-color": "white",
                    "background-size": "100% 100%"
                },
                ".glance.perspective .building": {
                    "display": "block",
                    "nx:absolute": "0"
                },
                ".glance.perspective > .mask": {
                    "display": "block",
                    "nx:absolute": "0 0 auto 0",
                    "background": "#0a233f",
                    "transition": ".3s",
                    "overflow": "hidden"
                },
                ".glance.perspective.masked > .mask": {
                    "height": "100%"
                },
                ".glance.perspective:not(.masked) > .mask": {
                    "height": "0"
                },
                ".glance.perspective > .mask .loading-logo": {
                    "width": "30em",
                    "height": "10em",
                    "color": "#ffffff",
                    "nx:absolute": "0",
                    "margin": "auto",
                    "transition": ".3s"
                },
                ".glance.perspective > .mask .loading-circle": {
                    "height": "6em",
                    "nx:absolute": "40% 0 0 0%",
                    "margin": "auto",
                    "transition": ".3s",
                    "animation": nx.util.csssheet.keyframes({
                        definition: {
                            "0%": {
                                "transform": "rotate(0deg)"
                            },
                            "100%": {
                                "transform": "rotate(360deg)"
                            },
                        },
                        "duration": "1s",
                        "timing-function": "linear"
                    })
                }
            })
        }
    });

})(nx);
