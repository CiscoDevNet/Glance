(function (nx) {
    /**
     * @class Filter
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.Filter", nx.lib.svg.AbstractNode, {
        properties: {
            /**
             * @property graph
             * @type {nx.lib.svg.Svg}
             */
            graph: {
                dependencies: "parentNode.graph"
            }
        }
    });
})(nx);
