(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class FeMerge
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.filter.FeMerge", nxex.graph.filter.Filter, {
        view: {
            tag: "svg:feMerge"
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
