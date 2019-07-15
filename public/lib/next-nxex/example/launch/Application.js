(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class Canvas
     * @namespace nxex.graph
     */
    var EXPORT = nx.define("nxex.example.launch.Application", nxex.struct.Element, {
        struct: {
            content: [{
		
                name: "link-transition"
            }]
        },
        properties: {
            /**
             * @property graph
             * @type {nxex.graph.Graph}
             * @inherited
             */
            graph: {
                value: function () {
                    return this;
                }
            },
            /**
             * @property naturalTerminal
             * @type {Boolean}
             */
            naturalTerminal: {
                value: false
            }
        },
        methods: {
            getWidth: function () {
                return this.resolve("@root").$dom.offsetWidth;
            },
            getHeight: function () {
                return this.resolve("@root").$dom.offsetHeight;
            }
        }
    });
    toolkit.css({
        ".nxex-graph": {
            "stroke": "black",
            "fill": "transparent"
        },
        "svg text": {
            "user-select": "none"
        }
    });

    nx.ready(EXPORT);
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
