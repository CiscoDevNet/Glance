(function (nx, ui, toolkit, annotation, global) {
    var template = nxex.struct.Template.template, binding = nxex.struct.Binding.binding;
    var EXPORT = nx.define("nxex.common.graph.stage.StageGraphDragCaptureHandler", nxex.struct.capture.CaptureHandler, {
        properties: {
            graph: {},
            capture: {
                cascade: {
                    source: "graph",
                    output: function (graph) {
                        return graph && function (evt) {
                            graph.resolve("@root").removeClass("with-transition");
                            graph.naturalTerminal(true);
                        }.bind(this);
                    }
                }
            },
            dragmove: {
                cascade: {
                    source: "graph",
                    output: function (graph) {
                        return graph && function (evt) {
                            graph.stage().applyTranslate(evt.capturedata.delta[0], evt.capturedata.delta[1]);
                        }.bind(this);
                    }
                }
            },
            release: {
                cascade: {
                    source: "graph",
                    output: function (graph) {
                        return graph && function (evt) {
                            var offset = evt.capturedata.offset;
                            if (this.offsetTooClose(offset)) {
                                graph.stage().applyTranslate(-offset[0], -offset[1]);
                                graph.fire("press", evt);
                            }
                            graph.naturalTerminal(false);
                            graph.resolve("@root").addClass("with-transition");
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
