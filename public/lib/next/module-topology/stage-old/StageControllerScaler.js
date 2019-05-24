(function (nx, ui, toolkit, annotation, global) {
    var template = nxex.struct.Template.template, binding = nxex.struct.Binding.binding;
    var INDICATOR_RADIUS = 5;
    var EXPORT = nx.define("nxex.common.graph.stage.StageControllerScaler", nxex.graph.Node, {
        events: ["scaling"],
        struct: {
            properties: {
                class: "nxex-stage-scaler"
            },
            content: [{
                type: "nxex.graph.shape.Edge",
                properties: {
                    class: "bar",
                    x: binding("width", function (width) {
                        return width / 2;
                    }),
                    y: INDICATOR_RADIUS,
                    dx: 0,
                    dy: binding("height", function (height) {
                        return height - INDICATOR_RADIUS * 2;
                    })
                }
            }, {
                name: "indicator",
                type: "nxex.graph.shape.Circle",
                properties: {
                    class: "indicator",
                    x: binding("width", function (width) {
                        return width / 2;
                    }),
                    y: binding("height, scaleCurrent, scaleMin, scaleMax", function (height, scaleCurrent, scaleMin, scaleMax) {
                        return (height - INDICATOR_RADIUS * 2) * Math.log(scaleMax / scaleCurrent) / Math.log(scaleMax / scaleMin) + INDICATOR_RADIUS;
                    }),
                    r: INDICATOR_RADIUS
                },
                events: {
                    mousedown: function (sender, evt) {
                        evt.capture(this.indicator());
                    },
                    dragstart: function () {
                        this._drag_scale = this.scaleCurrent();
                    },
                    dragmove: function (sender, evt) {
                        this.fire("scaling", {
                            scaling: Math.pow(this.scaleMin() / this.scaleMax(), evt.capturedata.offset[1] / (this.height() - INDICATOR_RADIUS * 2)) * this._drag_scale
                        });
                    }
                }
            }]
        },
        properties: {
            width: {
                value: 30
            },
            height: {
                value: 100
            },
            scaleCurrent: {
                value: 1
            },
            scaleMax: {
                value: 10
            },
            scaleMin: {
                value: .1
            }
        },
        statics: {
            CSS: toolkit.css({
                ".nxex-stage-scaler .bar": {
                    "stroke-width": "3px",
                    "stroke-edgecap": "round"
                },
                ".nxex-stage-scaler .indicator": {
                    "stroke": "transparent",
                    "stroke-width": "8px",
                    "fill": "rgba(0, 0, 0, .7)"
                }
            })
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
