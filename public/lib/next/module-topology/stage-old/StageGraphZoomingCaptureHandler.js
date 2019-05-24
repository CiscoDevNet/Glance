(function (nx, ui, toolkit, annotation, global) {
    var template = nxex.struct.Template.template, binding = nxex.struct.Binding.binding;
    var EXPORT = nx.define("nxex.common.graph.stage.StageGraphZoomingCaptureHandler", nxex.struct.capture.CaptureHandler, {
        properties: {
            previous: {},
            graph: {},
            capture: {
                cascade: {
                    source: "graph",
                    output: function (graph) {
                        return graph && function (evt) {
                            graph.rect().resolve("@root").removeStyle("display");
                            graph.rect().sets({
                                width: 0,
                                height: 0
                            });
                        }.bind(this);
                    }
                }
            },
            dragmove: {
                cascade: {
                    source: "graph",
                    output: function (graph) {
                        return graph && function (evt) {
                            var bound = graph.resolve("@root").$dom.getBoundingClientRect();
                            graph.rect().sets({
                                x: evt.capturedata.origin[0] - bound.left,
                                y: evt.capturedata.origin[1] - bound.top,
                                width: evt.capturedata.offset[0],
                                height: evt.capturedata.offset[1]
                            });
                        }.bind(this);
                    }
                }
            },
            dragend: {
                cascade: {
                    source: "graph",
                    output: function (graph) {
                        return graph && function (evt) {
                            graph.rect().resolve("@root").setStyle("display", "none");
                            var bound = graph.resolve("@root").$dom.getBoundingClientRect();
                            // do zooming and publish no event
                            var rect = this.fixRect({
                                left: evt.capturedata.origin[0] - bound.left,
                                top: evt.capturedata.origin[1] - bound.top,
                                width: evt.capturedata.offset[0],
                                height: evt.capturedata.offset[1]
                            });
                            var graphw = graph.getWidth(), graphh = graph.getHeight();
                            if (rect.width && rect.height) {
                                graph._applyStageMatrix(nxex.common.graph.stage.StageGraph.calcRectZoomMatrix({
                                    left: 0,
                                    top: 0,
                                    width: graphw,
                                    height: graphh
                                }, rect));
                            }
                            graph.zooming(false);
                        }.bind(this);
                    }
                }
            }
        },
        methods: {
            init: function (options) {
                this.inherited();
                this.sets(options);
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
