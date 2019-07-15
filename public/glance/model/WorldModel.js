(function(nx) {

    var sin = Math.sin;
    var cos = Math.cos;
    var tan = Math.tan;
    var sqrt = Math.sqrt;
    var atan2 = Math.atan2;
    var square = nx.math.square;

    var EXPORT = nx.define("glance.model.WorldModel", glance.model.CampusModel, {
        properties: {
            uiConfig: null,
            // inherited
            buildings: {
                watcher: function(pname, value) {
                    this.release("buildingsInjectEach");
                    if (nx.is(value, nx.List)) {
                        this.retain("buildingsInjectEach", nx.List.mapeach(value, {
                            "world": this,
                            "+index": 1,
                            "number+": 1,
                            "whoami": "world.whoami",
                            "onlines": nx.binding("id, world.onlines", true, function(async, id, onlines) {
                                if (onlines) {
                                    var list = nx.List.select(onlines, "buildingId", function(buildingId) {
                                        return id === buildingId;
                                    });
                                    async.set(list);
                                    return list;
                                }
                                return null;
                            })
                        }));
                    }
                }
            },
            components: function() {
                return new nx.List();
            },
            // switches
            showImage: true,
            showPerson: true,
            showThing: true,
            showBlock: true,
            showFurnish: true,
            showZone: true,
            showFacility: true,
            showHeatmap: false,
            disablePerspective: false,
            iconSizeLevel: 1,
            total: 0,
            whoami: null,
            onlines: null,
            onlineMap: {
                dependencies: "onlines",
                async: true,
                value: function(async, onlines) {
                    if (onlines) {
                        var map = new nx.Map();
                        map.retain(onlines.monitorContaining(function(online) {
                            return online.watch("id", function(pname, id) {
                                map.set(id, online);
                                return {
                                    release: function() {
                                        map.remove(id);
                                    }
                                };
                            });
                        }));
                        async.set(map);
                        return map;
                    }
                    return null;
                }
            },
            search: nx.binding("onlines", true, function(async, onlines) {
                var search = async.get() || async.set(new glance.model.SearchModel());
                search.items(onlines);
                search.world(this);
            }),
            urlQrCode: {
                async: true,
                value: function(async) {
                    var onhashchange = function(sender, url) {
                        var element = document.createElement("div");
                        $(element).qrcode({
                            text: url,
                            width: "1000",
                            height: "1000",
                            foreground: "#000000",
                            background: "#aaaaaa"
                        });
                        var context, canvas = element.childNodes[0];
                        var size, image = new Image();
                        image.src = canvas.toDataURL();
                        size = canvas.width;
                        canvas.width = size * 1.1;
                        canvas.height = size * 1.1;
                        context = canvas.getContext("2d");
                        context.fillStyle = "#aaaaaa";
                        context.fillRect(0, 0, canvas.width, canvas.height);
                        image.onload = function() {
                            context.drawImage(image, size / 20, size / 20);
                            async.set(canvas.toDataURL());
                        };
                    };
                    onhashchange(nx.util.hash, nx.global.location.href);
                    return nx.util.hash.on("change", onhashchange);
                }
            },
            // building
            building: null,
            cameraPositionOrigin: nx.binding("building.position", function(position) {
                return position && [position[0], position[1]] || [0, 0];
            }),
            // building and camera
            buildingFloorCount: nx.binding("building.floors.length"),
            buildingFloorUnit: nx.binding("building.width, building.depth", function(width, depth) {
                return (width + depth) / 32;
            }),
            buildingFloorUnitActual: nx.binding("buildingFloorUnit, whoami.category", function(unit, category) {
                return unit * (category !== "screen" ? 2 : 1);
            }),
            // control arugments
            viewportWidth: 1000,
            viewportHeight: 1000,
            // control step 
            viewStep: 0, // [0.5, 1): cascaded; [1, 2): separating; [2, 8]: zooming
            viewLevel: 0,
            // camera arguments
            cameraFov: Math.PI * 20 / 180, // 20deg
            cameraSlop: Math.PI * 45 / 180, // default: 15deg, in [15deg, 75deg]
            cameraRotation: Math.PI * 1 / 4, // default: 225deg
            cameraOffsetBreadth: 0,
            cameraOffsetDepth: 0,
            cameraSlopActual: nx.binding("cameraSlop", function(slop) {
                if (slop < EXPORT.SLOP_MIN) {
                    return EXPORT.SLOP_MIN;
                } else if (slop > EXPORT.SLOP_MAX) {
                    return EXPORT.SLOP_MAX;
                } else {
                    return slop;
                }
            }),
            buildingRotatedSize: nx.binding("cameraRotation, building.width, building.depth", function(rotation, width, depth) {
                var cosr = Math.abs(cos(rotation));
                var sinr = Math.abs(sin(rotation));
                return [width * cosr + depth * sinr, width * sinr + depth * cosr];
            }),
            buildingRotatedWidth: nx.binding("buildingRotatedSize.0"),
            buildingRotatedDepth: nx.binding("buildingRotatedSize.1"),
            cameraFitHorizontalDistanceOnWidthCenter: nx.binding("viewportWidth, viewportHeight, buildingRotatedWidth, cameraFov, cameraSlopActual", function(vw, vh, rwidth, fov, slop) {
                return vh * rwidth * cos(slop) / (2 * vw * tan(fov / 2));
            }),
            cameraFitHorizontalDistanceOnWidth: nx.binding("cameraFitHorizontalDistanceOnWidthCenter, buildingRotatedWidth, buildingFloorCount, buildingFloorUnit, cameraSlopActual", function(distance, rwidth, count, height0, slop) {
                count = Math.max(count, 2);
                var d, d0, diagonal, height;
                height = height0 * 2;
                d = d0 = sqrt(height * height + rwidth * rwidth) * cos(slop) * cos(atan2(height, rwidth) - slop) / 2;
                if (count > 2) {
                    height = height0 * count;
                    d = sqrt(height * height + rwidth * rwidth) * cos(slop) * cos(atan2(height, rwidth) - slop) / 2;
                    d = Math.max(d, d0);
                }
                return {
                    all: distance + d,
                    one: distance + d0
                };
            }),
            cameraFitHorizontalDistanceOnTop: nx.binding("buildingRotatedDepth, buildingFloorCount, buildingFloorUnit, cameraFov, cameraSlopActual", function(depth, count, height0, fov, slop) {
                count = Math.max(2, count);
                var d, d0, height;
                height = height0 * 2;
                d = d0 = (depth * tan(slop - fov / 2) - height) / (2 * (tan(slop) - tan(slop - fov / 2)));
                if (count > 2) {
                    height = count * height0;
                    d = (depth * tan(slop - fov / 2) - height) / (2 * (tan(slop) - tan(slop - fov / 2)));
                }
                return {
                    all: d,
                    one: d0
                };
            }),
            cameraFitHorizontalDistanceOnBottom: nx.binding("buildingRotatedDepth, buildingFloorCount, buildingFloorUnit, cameraFov, cameraSlopActual", function(depth, count, height0, fov, slop) {
                count = Math.max(2, count);
                var d, d0, height, rho;
                rho = slop + fov / 2;
                height = (rho > Math.PI / 2 ? -1 : 1) * 2 * height0;
                d = d0 = (depth * tan(rho) + height) / (2 * (tan(rho) - tan(slop)));
                if (count > 2) {
                    height = (rho > Math.PI / 2 ? -1 : 1) * count * height0;
                    d = (depth * tan(rho) + height) / (2 * (tan(rho) - tan(slop)));
                }
                return {
                    all: d,
                    one: d0
                };
            }),
            cameraFitHorizontalDistance: nx.binding("cameraFitHorizontalDistanceOnWidth, cameraFitHorizontalDistanceOnTop, cameraFitHorizontalDistanceOnBottom", function(dwidth, dtop, dbottom) {
                var dfit = dwidth && dtop && dbottom && {
                    all: Math.max(dwidth.all, dtop.all, dbottom.all),
                    one: Math.max(dwidth.one, dtop.one, dbottom.one)
                };
                return dfit || {
                    all: 1,
                    one: 1
                };
            }),
            viewStepZooming: nx.binding("cameraFitHorizontalDistance", function(dfit) {
                if (dfit.all < dfit.one) {
                    throw new Error("Building fit distance: all < one.");
                }
                return Math.max(dfit.all / dfit.one, EXPORT.STEP_ZOOMING_LEAST);
            }),
            viewStepZoomingLimit: nx.binding("viewStepZooming", function(stepzooming) {
                return stepzooming * EXPORT.STEP_ZOOMING_TIMES;
            }),
            viewStepActual: nx.binding("viewStep, viewStepZoomingLimit", function(step, steplimit) {
                if (step < EXPORT.STEP_MIN) {
                    return EXPORT.STEP_MIN;
                } else if (step > steplimit) {
                    return steplimit;
                } else {
                    return step;
                }
            }),
            viewLevelActual: nx.binding("viewStepActual, buildingFloorCount, viewLevel", function(step, count, level) {
                var limit, middle;
                limit = [0, count - 1];
                if (step < EXPORT.STEP_FIT) {
                    var middle = (count - 1) / 2;
                    limit = [(1 - step) * middle, (1 + step) * middle];
                }
                if (level < limit[0]) {
                    level = limit[0];
                } else if (level > limit[1]) {
                    level = limit[1];
                }
                return level;
            }),
            cameraHorizontalDistance: nx.binding("viewStepActual, viewStepZooming, cameraFitHorizontalDistance", function(step, stepzooming, dfit) {
                if (step < EXPORT.STEP_FIT) {
                    return dfit.all / step;
                } else if (step < stepzooming) {
                    return dfit.one * (stepzooming - step) / (stepzooming - EXPORT.STEP_FIT) + dfit.all * (step - EXPORT.STEP_FIT) / (stepzooming - EXPORT.STEP_FIT);
                } else {
                    return dfit.one * stepzooming / step;
                }
            }),
            buildingFloorAltitudeDifferenceLimit: nx.binding("cameraFov, cameraSlopActual, buildingRotatedDepth, buildingFloorUnit, cameraHorizontalDistance", function(fov, slop, depth, height0, distance) {
                return height0 + distance * depth * tan(slop) / (distance - depth / 2);
            }),
            buildingFloorAltitudeDifference: nx.binding("viewStepActual, viewStepZooming, buildingFloorUnit, buildingFloorAltitudeDifferenceLimit", function(step, stepzooming, height0, height1) {
                if (step < EXPORT.STEP_FIT) {
                    return height0;
                } else if (step < stepzooming) {
                    var rate = (step - EXPORT.STEP_FIT) / (stepzooming - EXPORT.STEP_FIT);
                    rate = rate * rate * rate;
                    return rate * height1 + (1 - rate) * height0;
                } else {
                    return height1;
                }
            }),
            buildingFloorHeight: nx.binding("buildingFloorUnit, buildingFloorAltitudeDifference", function(unit, height) {
                height = Math.min(Math.abs(unit), Math.abs(height));
                return height;
            }),
            cameraVerticalDistance: nx.binding("buildingFloorAltitudeDifference, viewLevelActual, cameraSlopActual, cameraHorizontalDistance", function(height, level, slop, distance) {
                return height * level + distance * tan(slop);
            }),
            cameraOffsetActual: nx.binding("viewStepActual, buildingRotatedDepth, cameraOffsetDepth, cameraOffsetBreadth", true, function(async, step, depth, odepth, obreadth) {
                var rate, value, offset = async.get();
                if (step < EXPORT.STEP_FIT) {
                    value = [0, 0];
                } else if (step < EXPORT.STEP_ZOOMING) {
                    rate = (step - EXPORT.STEP_FIT) / (EXPORT.STEP_ZOOMING - EXPORT.STEP_FIT);
                    value = [obreadth * rate, odepth * rate];
                } else {
                    // check bound
                    rate = depth / sqrt(odepth * odepth + obreadth * obreadth);
                    if (rate < 1) {
                        odepth *= rate, obreadth *= rate;
                    }
                    value = [obreadth, odepth];
                }
                // set value
                if (!offset || value[0] !== offset[0] || value[1] !== offset[1]) {
                    async.set(value);
                }
            }),
            cameraOffsetApplied: nx.binding("cameraPositionOrigin, cameraRotation, cameraOffsetActual", function(origin, rotation, offset) {
                return [origin[0] - (offset[0] * cos(rotation) + offset[1] * sin(rotation)), -origin[1] + offset[0] * sin(rotation) - offset[1] * cos(rotation)];
            }),
            cameraPosition: nx.binding("cameraHorizontalDistance, cameraVerticalDistance, cameraRotation, cameraOffsetApplied", function(horizontal, vertical, rotation, offset) {
                var x = horizontal * sin(rotation) + offset[0];
                var y = horizontal * cos(rotation) + offset[1];
                return [-x, -y, vertical];
            }),
            cameraLookat: nx.binding("buildingFloorAltitudeDifference, viewLevelActual, cameraOffsetApplied", function(height, level, offset) {
                return [-offset[0], -offset[1], height * level];
            }),
            iconSize: nx.binding("iconSizeLevel, buildingFloorHeight, viewStepActual, viewStepZooming", function(level, height, step, stepzooming) {
                return level * height / Math.max(1, step / stepzooming) * 2;
            })
        },
        methods: {
            getOnlineClient: function(pid) {
                var client, onlineMap = this.onlineMap();
                client = onlineMap && onlineMap.get(pid);
                if (!client) {
                    nx.each(this.buildings(), function(building) {
                        var clientMap = building.clientMap();
                        client = clientMap && clientMap.get(pid);
                    });
                }
                return client;
            },
            setClientPosition: function(pid, bid, fid, position) {
                var floor, client;
                client = this.getOnlineClient(pid);
                if (client.buildingId() === bid && client.floorId() === fid) {
                    floor = this.buildingMap().get(bid).floorMap().get(fid);
                    floor.setClientPosition(client, position);
                } else {
                    client.buildingId(bid);
                    client.floorId(fid);
                    client.position(position);
                }
            }
        },
        statics: {
            STEP_MIN: 0.8,
            STEP_FIT: 1,
            STEP_ZOOMING_LEAST: 2,
            STEP_ZOOMING_TIMES: 3,
            SLOP_MIN: Math.PI * 20 / 180,
            SLOP_DEFAULT: Math.PI * 45 / 180,
            SLOP_MAX: Math.PI * 89.9 / 180
        }
    });
})(nx);
