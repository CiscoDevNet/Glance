(function (nx, ui, toolkit, global) {
    /**
     * @class Circle
     * @extends nxex.graph.shape.Path
     * @namespace nxex.graph
     */
    var EXPORT = nx.define("nxex.graph.shape.Circle", nxex.graph.Node, {
        view: {
            tag: "svg:circle"
        },
        properties: {
            /**
             * @property center
             * @type {Boolean}
             */
            center: {
                value: true
            },
            /**
             * @property radius
             * @type {Number}
             */
            radius: {
                value: 10,
                watcher: function (pname, pvalue) {
                    this.resolve("@root").set("r", pvalue);
                }
            },
            centralize_internal_: {
                cascade: {
                    source: "center, radius",
                    update: function (center, radius) {
                        if (!center) {
                            this.resolve("@root").set("cx", radius);
                            this.resolve("@root").set("cy", radius);
                        } else {
                            this.resolve("@root").set("cx", 0);
                            this.resolve("@root").set("cy", 0);
                        }
                    }
                }
            }
        },
        methods: {}
    });
})(nx, nx.ui, nxex.toolkit, window);
