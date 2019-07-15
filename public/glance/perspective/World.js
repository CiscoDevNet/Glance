(function(nx) {

    var sin = Math.sin;
    var cos = Math.cos;
    var asin = Math.asin;
    var tan = Math.tan;
    var cot = nx.math.cot;
    var PI = Math.PI;

    var WorldModel = glance.model.WorldModel;
    var BuildingModel = glance.model.BuildingModel;
    var FloorModel = glance.model.FloorModel;

    var EXPORT = nx.define("glance.perspective.World", nx.ui.Element, {
        view: {
            cssclass: "glance-world",
            content: [{
                name: "stage",
                type: "sanvy.Stage",
                cssclass: "glance-stage",
                extend: {
                    scene: {
                        content: [{
                            name: "buildingsContainer",
                            content: {
                                repeat: "{model.buildings}",
                                type: "glance.perspective.Building",
                                properties: {
                                    model: "{scope.model}"
                                }
                            }
                        }]
                    }
                },
                content: {
                    type: "glance.perspective.StageControlPanel",
                    properties: {
                        model: "{model}"
                    }
                },
                capture: {
                    start: "{actionClear}",
                    end: "{actionClear}",
                    hold: "{actionSwitchMode}",
                    transform: "{actionTransform}",
                    drag: function(sender, evt) {
                        if (this._actionSwitchMode || nx.path(this, "model.disablePerspective")) {
                            this.actionTranslate(evt.capturedata.delta);
                        } else {
                            this.actionRotate(evt.capturedata.delta);
                        }
                    },
                    tap: function(sender, evt) {
                        var stage = this.stage();
                        var bound = this.stage().getBound();
                        var currentBuildingModel = nx.path(this, "model.building");
                        var buildings = this.buildingsContainer().childObjects();
                        var groups = buildings.toArray().map(function(building) {
                            return building.object();
                        });
                        stage.pick(evt.capturedata.position[0] - bound.left, evt.capturedata.position[1] - bound.top, groups, function(group, object) {
                            if (!group) {
                                return;
                            }
                            var target = object.sanvy;
                            var building = buildings.find(function(building) {
                                return building.object() === group;
                            });
                            var picked;
                            while (!picked && target && target !== building) {
                                if (nx.path(target, "model.category")) {
                                    picked = target;
                                    break;
                                }
                                if (nx.path(target, "model.building") === currentBuildingModel) {
                                    // hit a floor on current building
                                    break;
                                }
                                target = nx.path(target, "parent");
                            }
                            if (picked) {
                                this.fire("picked", {
                                    model: picked.model()
                                });
                            } else {
                                this.attended(target.model());
                            }
                        }.bind(this));
                    }
                }
            }, {
                type: "glance.perspective.Header",
                properties: {
                    model: "{model}"
                }
            }, {
                type: "glance.perspective.ControlPanel",
                properties: {
                    model: "{model}"
                },
                events: {
                    picked: function(sender, picked) {
                        this.showDetail(picked.model);
                    }
                }
            }],
            events: {
                picked: function(sender, picked) {
                    this.showDetail(picked.model);
                }

            }
        },
        properties: {
            model: null,
            now: {
                async: true,
                value: function(async) {
                    return nx.timer(1000, function(again) {
                        var now = new Date();
                        async.set({
                            year: nx.date.format("yyyy", now),
                            month: nx.date.format("MMM", now),
                            day: nx.date.format("dd", now),
                            hour: nx.date.format("HH", now),
                            minute: nx.date.format("mm", now)
                        });
                        again();
                    });
                }
            },
            stageUpdate: nx.binding("stage.width, stage.height, model", function(width, height, model) {
                if (model) {
                    model.viewportWidth(width);
                    model.viewportHeight(height);
                }
            }),
            cameraUpdate: nx.binding("stage.camera, model.viewportWidth, model.viewportHeight, model.cameraFov, model.cameraPosition, model.cameraLookat", function(camera, vw, vh, fov, position, lookat) {
                if (camera && fov && vw && vh && position && lookat) {
                    camera.fov = fov * 180 / Math.PI;
                    camera.aspect = vw / vh;
                    camera.position.set(position[0], position[1], position[2]);
                    camera.lookAt(new THREE.Vector3(lookat[0], lookat[1], lookat[2]));
                }
            }),
            attended: null,
            attendAnimation: {
                dependencies: "attended",
                value: function(attended) {
                    this.release("attendAnimation");
                    var animation, runtime, model = this.model();
                    if (nx.is(attended, BuildingModel)) {
                        animation = nx.util.paint.animate(this, function(animation) {
                            animation.set({
                                "model.cameraPositionOrigin": nx.path(attended, "position"),
                                "model.viewLevel": nx.path(attended, "index"),
                                "model.viewStep": WorldModel.STEP_MIN
                            });
                        }.bind(this));
                        runtime = animation.start(EXPORT.DEFAULT_DURATION);
                        runtime.retain(animation)
                        runtime.retain({
                            release: function() {
                                this.model().building(attended);
                                this.attended(null);
                            }.bind(this)
                        });
                        this.retain("attendAnimation", runtime);
                    } else if (nx.is(attended, FloorModel)) {
                        animation = nx.util.paint.animate(this, function(animation) {
                            animation.set({
                                "model.viewLevel": nx.path(attended, "index"),
                                "model.viewStep": model.viewStep() >= model.viewStepZooming() ? WorldModel.STEP_MIN : model.viewStepZooming()
                            });
                        }.bind(this));
                        runtime = animation.start(EXPORT.DEFAULT_DURATION);
                        runtime.retain(animation)
                        runtime.retain({
                            release: function() {
                                this.attended(null);
                            }.bind(this)
                        });
                        this.retain("attendAnimation", runtime);
                    }
                    return animation;
                }
            }
        },
        methods: {
            init: function() {
                this.inherited();
                this.stage().camera().up.set(0, 0, 1);
                this.retain(nx.Object.cascade(this, "search.word", function(word) {
                    var model = this.model();
                    model && model.searchKeyWord(word);
                }.bind(this)));
                // check fps for loading
                this.retain("fpsCheck", this.stage().on("fps", (function() {
                    var FPS = 30;
                    var fpss = [];
                    return function(sender, fps) {
                        if (fps < FPS && fpss[fpss.length - 1] < FPS) {
                            this.fire("paint");
                            this.release("fpsCheck");
                        }
                        fpss.push(fps);
                    }.bind(this);
                }).call(this)));
            },
            actionClear: function() {
                // clear temporary terrains and out-bound values
                var model = this.model();
                model.viewStep(model.viewStepActual());
                model.viewLevel(model.viewLevelActual());
                model.cameraSlop(model.cameraSlopActual());
                model.cameraOffsetBreadth(model.cameraOffsetActual()[0]);
                model.cameraOffsetDepth(model.cameraOffsetActual()[1]);
                delete this._actionSwitchMode;
            },
            actionSwitchMode: function(sender, evt) {
                this._actionSwitchMode = true;
            },
            actionTransform: function(sender, evt) {
                var viewStep;
                // handle zooming
                var model, scale;
                model = this.model();
                viewStep = model.viewStep();
                scale = evt.capturedata.delta.scale;
                model.viewStep(viewStep * scale);
            },
            actionRotate: function(delta) {
                var model = this.model();
                var width = model.viewportWidth();
                var height = model.viewportHeight();
                var slop = model.cameraSlop();
                var rotation = model.cameraRotation();
                model.cameraRotation(rotation + Math.PI * 2 * delta[0] / width);
                model.cameraSlop(slop + delta[1] / height * 3 * (WorldModel.SLOP_MAX - WorldModel.SLOP_MIN));
            },
            actionTranslate: function(delta) {
                // handle translate
                var model = this.model();
                var viewStep = model.viewStep();
                if (viewStep < model.viewStepZooming()) {
                    this.actionChangeLevel(delta);
                } else {
                    this.actionMove(delta);
                }
            },
            actionChangeLevel: function(delta) {
                var model = this.model();
                var viewLevel = model.viewLevel();
                var fov = model.cameraFov();
                var slop = model.cameraSlopActual();
                var distance = model.cameraHorizontalDistance();
                var height = model.buildingFloorAltitudeDifference();
                var vh = model.viewportHeight();
                viewLevel += (tan(slop + fov / 2) - tan(slop - fov / 2)) * distance * delta[1] / height / vh;
                model.viewLevel(viewLevel);
            },
            actionMove: function(delta) {
                var model = this.model();
                var obreadth = model.cameraOffsetBreadth();
                var odepth = model.cameraOffsetDepth();
                var fov = model.cameraFov();
                var slop = model.cameraSlopActual();
                var width = model.buildingRotatedWidth()
                var distance = model.cameraVerticalDistance();
                var vw = model.viewportWidth();
                var vh = model.viewportHeight();
                var zoom = model.viewStep() / model.viewStepZooming();
                obreadth += -width * delta[0] / zoom / vw;
                odepth += -2 * sin(fov) / (cos(PI + fov) + cos(slop * 2)) * distance * delta[1] / zoom / vh;
                model.cameraOffsetBreadth(obreadth);
                model.cameraOffsetDepth(odepth);
            },
            actionSwitchBuilding: function(building) {
                var model = this.model();
                model.building(building);
            },
            showDetail: function(model) {
                var dialog;
                if (nx.is(model, glance.model.ClientModel)) {
                    if (model.category() === "expert" || model.category() === "guest") {
                        dialog = new glance.perspective.DialogDeviceDetail();
                    } else {
                        dialog = new glance.perspective.DialogMarkDetail();
                    }
                } else {
                    // TODO
                    return;
                };
                //send message
                dialog.on("sendMessage", function(sender, model) {
                    var sdialog = new glance.perspective.DialogSendMessage();
                    dialog.visible(false);
                    dialog.retain(sdialog);
                    sdialog.on("close", function(sender) {
                        dialog.release();
                    }.bind(this));
                    sdialog.on("backward", function(sender, model) {
                        sdialog.release();
                        dialog.visible(true);
                    }.bind(this));
                    sdialog.model(model);
                    sdialog.retain("replace", sdialog.appendTo());
                }.bind(this));
                //view profile
                dialog.on("viewProfile", function(sender, model) {
                    var sdialog = new glance.perspective.DialogProfileDetail();
                    dialog.visible(false);
                    dialog.retain(sdialog);
                    sdialog.on("close", function(sender) {
                        dialog.release();
                    }.bind(this));
                    sdialog.on("backward", function(sender, model) {
                        sdialog.release();
                        dialog.visible(true);
                    }.bind(this));
                    sdialog.model(model);
                    sdialog.retain("replace", sdialog.appendTo());
                }.bind(this));
                // navigation
                dialog.routable(nx.path(this, "model.whoami.category") === "screen");
                dialog.on("navigate", function(sender, toggle) {
                    var hash = nx.util.hash;
                    var map = hash.getHashMap();
                    var route, source, target;
                    if (toggle) {
                        source = this.model().whoami().id();
                        target = model.id();
                        route = [source, target].join("/");
                        if (map.route !== route) {
                            map.route = route;
                            hash.setHashMap(map);
                        }
                    } else {
                        if (map.route) {
                            delete map.route;
                            hash.setHashMap(map);
                        }
                    }
                    dialog.release();
                }.bind(this));
		// close
                dialog.on("close", function(sender) {
                    dialog.release();
                }.bind(this));
                dialog.model(model);
                dialog.retain(dialog.appendTo())
            }

        },
        statics: {
            DEFAULT_DURATION: 300,
            CSS: nx.util.csssheet.create({
                ".glance-world > .glance-stage": {
                    "nx:absolute": "4em 4em 0 0"
                },
                ".glance-world > .labels": {
                    "nx:absolute": "4em 4em 0 0"
                },
                ".glance-world > .labels > nx-element": {
                    "position": "absolute",
                    "transition": ".3s",
                    "color": "#cd0101"
                },
                ".glance-world > .labels:not(.active-false) > nx-element": {
                    "max-width": "25%"
                }
            })
        }
    });
})(nx);
