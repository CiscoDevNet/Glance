(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class FeOffset
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.filter.FeOffset", nxex.graph.filter.Filter, {
        view: {
            tag: "svg:feOffset"
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
