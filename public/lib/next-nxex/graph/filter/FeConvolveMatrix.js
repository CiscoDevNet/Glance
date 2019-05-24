(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class FeConvolveMatrix
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.filter.FeConvolveMatrix", nxex.graph.filter.Filter, {
        view: {
            tag: "svg:feConvolveMatrix"
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
