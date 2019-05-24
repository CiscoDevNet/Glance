(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class Filter
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.filter.Filter", nxex.graph.AbstractNode, {
        view: {
            tag: "svg:filter"
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
