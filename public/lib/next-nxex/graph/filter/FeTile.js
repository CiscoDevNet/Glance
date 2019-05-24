(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class FeTile
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.filter.FeTile", nxex.graph.filter.Filter, {
        view: {
            tag: "svg:feTile"
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
