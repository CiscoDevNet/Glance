(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class Canvas
     * @namespace nxex.graph
     */
    var EXPORT = nx.define("nxex.example.linktransition.LinkTransition", nxex.graph.Node, {
        view: {
            tag: "svg:line",
            props: {
                x1: "0",
                y1: "0",
                x2: "1px",
                y2: "0"
            }
        },
        properties: {
            naturalStrokeWidth: {
                value: null
            },
            strokeWidth: {
                cascade: {
                    source: "naturalStrokeWidth, naturalScale",
                    output: function (w, s) {
                        return w ? w / s : this._strokeWidth;
                    }
                }
            },
            dx: {
                value: 1
            },
            dy: {
                value: 0
            }
        }
    });

    nx.ready(EXPORT);
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
