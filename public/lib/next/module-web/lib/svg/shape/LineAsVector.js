(function (nx) {

    // short cuts of functions

    /**
     * @class Path
     * @extends nx.lib.svg.Node
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.shape.LineAsVector", nx.lib.svg.Node, {
        view: {
            attributes: {
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
                value: 0,
                watcher: function (pname, pvalue) {
                    if (!pvalue && pvalue !== 0) {
                        pvalue = "";
                    }
                    this.setAttribute("x2", pvalue);
                }
            },
            /**
             * @property dy
             * @type {Number}
             */
            dy: {
                value: 0,
                watcher: function (pname, pvalue) {
                    if (!pvalue && pvalue !== 0) {
                        pvalue = "";
                    }
                    this.setAttribute("y2", pvalue);
                }
            }
        },
        methods: {
            init: function () {
                this.inherited("line");
            }
        }
    });
})(nx);
