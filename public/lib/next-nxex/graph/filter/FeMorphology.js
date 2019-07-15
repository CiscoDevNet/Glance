(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class FeMorphology
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.filter.FeMorphology", nxex.graph.filter.Filter, {
        view: {
            tag: "svg:feMorphology"
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
