(function(nx) {
    var PI = Math.PI;
    var abs = Math.abs;
    var max = Math.max;
    var min = Math.min;
    var sin = Math.sin;
    var cos = Math.cos;
    var asin = Math.asin;
    var tan = Math.tan;
    var atan = Math.atan;
    var atan2 = Math.atan2;
    var cot = nx.math.cot;
    var sqrt = Math.sqrt;
    var sq = nx.math.square;
    var BuildingModel = glance.model.BuildingModel;
    var WorldModel = glance.model.WorldModel;
    var EXPORT = nx.define("glance.perspective.Building", sanvy.Object, {
        sanvy: {
            properties: {
                "object.visible": nx.binding("model.world.viewStep, model.world.building", function(step, currentBuilding) {
                    var model = this.model();
                    return step === WorldModel.STEP_MIN || currentBuilding === model;
                }),
                "object.position.x": "{model.position.0}",
                "object.position.y": "{model.position.1}"
            },
            content: [{
                name: "floorsContainer",
                content: {
                    repeat: "{model.floors}",
                    type: "glance.perspective.Floor",
                    properties: {
                        model: "{scope.model}",
                        slop: "{scope.model.world.cameraSlopActual}",
                        rotation: "{scope.model.world.cameraRotation}",
                        height: "{scope.model.world.buildingFloorHeight}",
                        altitude: nx.binding("scope.index, scope.context.model.world.buildingFloorAltitudeDifference", function(index, height) {
                            return height * index;
                        }),
                        routeSegment: nx.binding("scope.model, scope.context.model.route.selected", true, function(async, model, selected) {
                            this.release("buildingRouteSegment");
                            if (model && selected) {
                                var resources = new nx.Object();
                                resources.retain(nx.List.select(selected, function(segment) {
                                    if (nx.path(segment, "floorInfo.floor") === model) {
                                        async.set(segment);
                                        resources.retain({
                                            release: function() {
                                                async.set(null);
                                            }
                                        });
                                    }
                                }.bind(this)));
                                this.retain("buildingRouteSegment", resources);
                            }
                        })
                    }
                }
            }, {
                content: nx.binding("buildingFloorInfo, rotation, model.route", true, function(async, buildingFloorInfo, rotation, route) {
                    this.release("buildingLift");
                    if (buildingFloorInfo && nx.is(rotation, Number) && route) {
                        var resources = new nx.Object();
                        resources.retain(route.watch("selected", function(pname, selected) {
                            if (selected) {
                                var lift = selected.find(function(segment) {
                                    return segment instanceof glance.model.RouteModel.LiftRouteSegmentModel;
                                });
                                if (lift) {
                                    var scale = buildingFloorInfo.scale;
                                    var sourcePoint = lift.points()[0];
                                    var targetPoint = lift.points()[1];
                                    var source = this.getPositionInStage(sourcePoint[2], [sourcePoint[0], sourcePoint[1]]);
                                    var target = this.getPositionInStage(targetPoint[2], [targetPoint[0], targetPoint[1]]);
                                    var geometry = new THREE.Geometry();
                                    geometry.vertices.push(new THREE.Vector3(source[0], source[1], source[2]));
                                    geometry.vertices.push(new THREE.Vector3(target[0], target[1], target[2]));
                                    geometry.computeLineDistances();
                                    var material = new THREE.LineDashedMaterial({
                                        color: 0xfbb03b,
                                        linewidth: 1,
                                        dashSize: 5 * scale,
                                        gapSize: 5 * scale
                                    });
                                    async.set({
                                        properties: {
                                            "object": new THREE.Line(geometry, material),
                                            "object.visible": nx.binding("active", function(active) {
                                                return !active;
                                            })
                                        }
                                    });
                                    resources.retain({
                                        release: function() {
                                            async.set(null);
                                        }
                                    });
                                }
                            }
                        }.bind(this)));
                        this.retain("buildingLift", resources);
                    }
                })
            }]
        },
        properties: {
            model: null
        }
    });
})(nx);
