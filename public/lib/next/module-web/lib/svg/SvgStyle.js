(function(nx) {
    /**
     * @class SvgStyle
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.SvgStyle", nx.lib.svg.AbstractNode, {
        methods: {
            init: function() {
                this.inherited("style", nx.lib.svg.Svg.DEFAULT_XML_NAMESPACE);
            }
        },
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
