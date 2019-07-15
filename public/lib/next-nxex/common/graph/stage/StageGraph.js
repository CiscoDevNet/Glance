(function (nx, ui, toolkit, annotation, global) {
    var template = nxex.struct.Template.template, binding = nxex.struct.Binding.binding;
    var EXPORT = nx.define("nxex.common.graph.stage.StageGraph", nxex.graph.Graph, {
        events: ["rect", "press"],
        struct: {
            properties: {
                stroke: "none",
                class: "nxex-stage with-transition"
            },
            events: {
                mousewheel: function (sender, evt) {
                    var point = [evt.offsetX, evt.offsetY];
                    this.naturalTerminal(true);
                    if (evt.deltaY > 0) {
                        this._applyStageScale(.8, point);
                    } else {
                        this._applyStageScale(1.25, point);
                    }
                },
                mousedown: function (sender, evt) {
                    evt.capture(this.captureHandler_internal_());
                }
            },
            content: [{
                name: "stage",
                events: {
                    "webkitTransitionEnd": function () {
                        this.naturalTerminal(false);
                    }
                }
            }, {
                name: "rect",
                type: "nxex.graph.shape.Rectangle",
                properties: {
                    stroke: "rgba(192, 225, 255, .7)",
                    fill: "rgba(192, 225, 255, .3)",
                    x: binding("dragRectShowing_internal_.left"),
                    y: binding("dragRectShowing_internal_.top"),
                    width: binding("dragRectShowing_internal_.width"),
                    height: binding("dragRectShowing_internal_.height")
                }
            }, {
                name: "controller",
                properties: {
                    class: "controller",
                    x: 10,
                    y: 10
                },
                events: {
                    mousewheel: function (sender, evt) {
                        evt.stopPropagation();
                    },
                    mousedown: function (sender, evt) {
                        evt.capture(this.controller());
                    }
                },
                content: [{
                    name: "btnSelectRect",
                    type: "nxex.common.graph.stage.StageControllerButton",
                    properties: {
                        width: binding("controllerStyle.buttonWidth"),
                        height: binding("controllerStyle.buttonHeight"),
                        icon: "selectable"
                    },
                    events: {
                        click: function (sender, evt) {
                            this.btnSelectRect().resolve("@root").addClass("active");
                            this.btnSelectHand().resolve("@root").removeClass("active");
                            this.mode("rect");
                        }
                    }
                }, {
                    name: "btnSelectHand",
                    type: "nxex.common.graph.stage.StageControllerButton",
                    properties: {
                        class: "active",
                        width: binding("controllerStyle.buttonWidth"),
                        height: binding("controllerStyle.buttonHeight"),
                        y: binding("controllerStyle.buttonHeight"),
                        icon: "draggable"
                    },
                    events: {
                        click: function (sender, evt) {
                            this.btnSelectHand().resolve("@root").addClass("active");
                            this.btnSelectRect().resolve("@root").removeClass("active");
                            this.mode("move");
                        }
                    }
                }, {
                    name: "btnZoomIn",
                    type: "nxex.common.graph.stage.StageControllerButton",
                    properties: {
                        width: binding("controllerStyle.buttonWidth"),
                        height: binding("controllerStyle.buttonHeight"),
                        y: binding("controllerStyle", function (style) {
                            return style.buttonHeight * 2;
                        }),
                        icon: "plus"
                    },
                    events: {
                        click: function (sender, evt) {
                            var point = [this.getWidth() / 2, this.getWidth() / 2];
                            this._applyStageScale(1.25, point);
                        }
                    }
                }, {
                    name: "scaler",
                    type: "nxex.common.graph.stage.StageControllerScaler",
                    properties: {
                        width: binding("controllerStyle", function (style) {
                            return style.buttonWidth;
                        }),
                        height: binding("controllerStyle", function (style) {
                            return style.barHeight;
                        }),
                        y: binding("controllerStyle", function (style) {
                            return style.buttonHeight * 3;
                        }),
                        scaleMax: binding("scaleMax"),
                        scaleMin: binding("scaleMin"),
                        scaleCurrent: binding("scaleCurrent_internal_")
                    },
                    events: {
                        scaling: function (sender, data) {
                            var point = [this.getWidth() / 2, this.getWidth() / 2];
                            this._applyStageScale(data.scaling / this.stage().scale(), point);
                        }
                    }
                }, {
                    name: "btnZoomOut",
                    type: "nxex.common.graph.stage.StageControllerButton",
                    properties: {
                        width: binding("controllerStyle.buttonWidth"),
                        height: binding("controllerStyle.buttonHeight"),
                        y: binding("controllerStyle", function (style) {
                            return style.buttonHeight * 3 + style.barHeight;
                        }),
                        icon: "minus"
                    },
                    events: {
                        click: function (sender, evt) {
                            var point = [this.getWidth() / 2, this.getWidth() / 2];
                            this._applyStageScale(.8, point);
                        }
                    }
                }, {
                    name: "btnZoom",
                    type: "nxex.common.graph.stage.StageControllerButton",
                    properties: {
                        class: binding("zooming", function (zooming) {
                            return zooming && "active";
                        }),
                        width: binding("controllerStyle.buttonWidth"),
                        height: binding("controllerStyle.buttonHeight"),
                        y: binding("controllerStyle", function (style) {
                            return style.buttonHeight * 4 + style.barHeight;
                        }),
                        icon: "zoomdot"
                    },
                    events: {
                        click: function (sender, evt) {
                            this.zooming(true);
                        }
                    }
                }, {
                    name: "btnZoomFit",
                    type: "nxex.common.graph.stage.StageControllerButton",
                    properties: {
                        width: binding("controllerStyle.buttonWidth"),
                        height: binding("controllerStyle.buttonHeight"),
                        y: binding("controllerStyle", function (style) {
                            return style.buttonHeight * 5 + style.barHeight;
                        }),
                        icon: "maximize"
                    },
                    events: {
                        click: function (sender, evt) {
                            this.fit();
                        }
                    }
                }, {
                    name: "btnFullScreen",
                    type: "nxex.common.graph.stage.StageControllerButton",
                    properties: {
                        width: binding("controllerStyle.buttonWidth"),
                        height: binding("controllerStyle.buttonHeight"),
                        y: binding("controllerStyle", function (style) {
                            return style.buttonHeight * 6 + style.barHeight;
                        }),
                        icon: "exportable"
                    },
                    events: {
                        click: function () {
                            EXPORT.toggleFullScreen();
                            this.fit();
                        }
                    }
                }]
            }]
        },
        properties: {
            mode: {
                value: "move"
            },
            zooming: {
                value: false,
                watcher: function () {

                }
            },
            captureHandler_internal_: {
                cascade: {
                    source: "captureHandlerOfMode_internal_, zooming",
                    output: function (captureHandlerOfMode_internal_, zooming) {
                        if (zooming) {
                            return new nxex.common.graph.stage.StageGraphZoomingCaptureHandler({
                                graph: this,
                                previous: captureHandlerOfMode_internal_
                            });
                        } else {
                            return captureHandlerOfMode_internal_;
                        }
                    }
                }
            },
            captureHandlerOfMode_internal_: {
                cascade: {
                    source: "mode",
                    output: function (mode) {
                        if (mode === "move") {
                            return new nxex.common.graph.stage.StageGraphDragCaptureHandler(this);
                        } else if (mode === "rect") {
                            return new nxex.common.graph.stage.StageGraphRectCaptureHandler(this);
                        }
                    }
                }
            },
            providerFitMatrix: {
                value: function () {
                    return function (graph) {
                        return nxex.geometry.Matrix.I;
                    };
                }
            },
            controllerStyle: {
                value: {
                    buttonWidth: 24,
                    buttonHeight: 24,
                    barHeight: 100
                }
            },
            scaleMax: {
                value: 8
            },
            scaleMin: {
                value: .5
            },
            selectionRect: {
                cascade: {
                    source: "mode, zooming, dragRectFixed_internal_",
                    output: function (mode, zooming, dragRectFixed_internal_) {
                        if (mode !== "move" && !zooming) {
                            return dragRectFixed_internal_;
                        }
                    }
                }
            },
            scaleCurrent_internal_: {
                cascade: {
                    source: "stage.scale",
                    output: function (scale) {
                        return scale;
                    }
                }
            }
        },
        methods: {
            fit: function () {
                this._setStageMatrix(this.providerFitMatrix()(this.graph()));
            },
            _setStageMatrix: function (matrix, according) {
                according = according || [this.getWidth() / 2, this.getHeight() / 2];
                var m = new nxex.geometry.Matrix(matrix);
                if (m.scale() > this.scaleMax()) {
                    m.applyScale(this.scaleMax() / m.scale(), according);
                }
                if (m.scale() < this.scaleMin()) {
                    m.applyScale(this.scaleMin() / m.scale(), according);
                }
                if (!nxex.geometry.Matrix.approximate(this.stage().matrix(), m.matrix())) {
                    this.stage().matrix(m.matrix());
                }
            },
            _applyStageMatrix: function (matrix, according) {
                this._setStageMatrix(nxex.geometry.Matrix.multiply(this.stage().matrix(), matrix), according);
            },
            _applyStageScale: function (scale, according) {
                scale = scale || 1, according = according || [this.getWidth() / 2, this.getHeight() / 2];
                var matrix = nxex.geometry.Matrix.multiply([[1, 0, 0], [0, 1, 0], [-according[0], -according[1], 1]], [[scale, 0, 0], [0, scale, 0], [0, 0, 1]], [[1, 0, 0], [0, 1, 0], [according[0], according[1], 1]]);
                this._applyStageMatrix(matrix, according);
            }
        },
        statics: {
            toggleFullScreen: function () {
                if (!document.fullscreenElement && // alternative standard method
                !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) { // current working methods
                    if (document.documentElement.requestFullscreen) {
                        document.documentElement.requestFullscreen();
                    } else if (document.documentElement.msRequestFullscreen) {
                        document.documentElement.msRequestFullscreen();
                    } else if (document.documentElement.mozRequestFullScreen) {
                        document.documentElement.mozRequestFullScreen();
                    } else if (document.documentElement.webkitRequestFullscreen) {
                        document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                    }
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    } else if (document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    }
                }
            },
            calcRectZoomMatrix: function (graph, rect) {
                var s = (!rect.width && !rect.height) ? 1 : Math.min(graph.height / Math.abs(rect.height), graph.width / Math.abs(rect.width));
                var dx = (graph.left + graph.width / 2) - s * (rect.left + rect.width / 2);
                var dy = (graph.top + graph.height / 2) - s * (rect.top + rect.height / 2);
                return [[s, 0, 0], [0, s, 0], [dx, dy, 1]];
            },
            CSS: toolkit.css({
                ".nxex-stage": {
                    "position": "relative"
                },
                ".nxex-stage g": {
                    transition: "none"
                },
                ".nxex-stage.with-transition > g": {
                    transition: "all .3s linear"
                },
                ".nxex-stage text": {
                    "font-family": "Arial",
                    "font-weight": "normal",
                    "font-size": "10px"
                },
                ".nxex-stage .controller .nxex-stage-button .face": {
                    "stroke": "none",
                    "fill": "transparent"
                },
                ".nxex-stage .controller .nxex-stage-button .icon": {
                    "stroke": "none",
                    "fill": "black"
                },
                ".nxex-stage .controller .nxex-stage-button:hover .icon": {
                    "fill": "#0396eb"
                },
                ".nxex-stage .controller .nxex-stage-button.active .icon": {
                    "fill": "#0396eb"
                },
                ".nxex-stage .controller .nxex-stage-scaler .bar": {
                    "stroke": "rgba(127, 127, 127, 1)"
                },
                ".nxex-stage .controller .nxex-stage-scaler .indicator": {
                    "fill": "rgba(127, 127, 127, 1)"
                },
                ".nxex-stage .controller .nxex-stage-scaler .indicator:hover": {
                    "fill": "rgba(48, 150, 235, .5)"
                },
                ".nxex-stage .controller .nxex-stage-scaler .indicator:active": {
                    "fill": "rgba(48, 150, 235, .5)"
                }
            })
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
