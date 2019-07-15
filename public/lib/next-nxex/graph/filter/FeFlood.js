(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class FeFlood
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.filter.FeFlood", nxex.graph.filter.Filter, {
        view: {
            tag: "svg:feFlood"
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
