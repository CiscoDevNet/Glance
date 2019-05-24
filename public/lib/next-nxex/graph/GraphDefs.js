(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class GraphDefs
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.GraphDefs", nxex.graph.AbstractNode, {
        view: {
            tag: "svg:defs"
        },
        properties: {
            /**
             * @property graph
             * @type {nxex.graph.Graph}
             * @inherited
             */
            graph: {
                cascade: {
                    source: "parentNode.graph"
                }
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
