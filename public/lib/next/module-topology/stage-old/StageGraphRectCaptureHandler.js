(function (nx, ui, toolkit, annotation, global) {
    var template = nxex.struct.Template.template, binding = nxex.struct.Binding.binding;
    var EXPORT = nx.define("nxex.common.graph.stage.StageGraphRectCaptureHandler", nxex.struct.capture.CaptureHandler, {
        properties: {
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
                            var offset = evt.capturedata.offset;
                            if (this.offsetTooClose(offset)) {
                                graph.fire("press", evt);
                            } else {
                                var bound = graph.resolve("@root").$dom.getBoundingClientRect();
                                graph.fire("rect", {
                                    event: evt,
                                    rect: this.fixRect({
                                        left: evt.capturedata.origin[0] - bound.left,
                                        top: evt.capturedata.origin[1] - bound.top,
                                        width: evt.capturedata.offset[0],
                                        height: evt.capturedata.offset[1]
                                    })
                                });
                            }
                        }.bind(this);
                    }
                }
            }
        },
        methods: {
            init: function (graph) {
                this.inherited();
                this.graph(graph);
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
