(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class FeColorMatrix
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.filter.FeColorMatrix", nxex.graph.filter.Filter, {
        view: {
            tag: "svg:feColorMatrix"
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
