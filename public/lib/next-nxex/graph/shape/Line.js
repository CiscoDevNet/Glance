(function (nx, ui, toolkit, global) {

    // short cuts of functions

    /**
     * @class Path
     * @extends nxex.graph.Node
     * @namespace nxex.graph
     */
    var EXPORT = nx.define("nxex.graph.shape.Line", nxex.graph.Node, {
        view: {
            tag: "svg:line",
            props: {
                x1: "0",
                y1: "0"
            }
        },
        properties: {
            /**
             * @property dx
             * @type {Number}
             */
            dx: {
                value: 100,
                watcher: function (pname, pvalue) {
                    this.resolve("@root").set("x2", pvalue);
                }
            },
            /**
             * @property dy
             * @type {Number}
             */
            dy: {
                value: 0,
                watcher: function (pname, pvalue) {
                    this.resolve("@root").set("y2", pvalue);
                }
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, window);
