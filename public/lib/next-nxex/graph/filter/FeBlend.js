(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class FeBlend
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.filter.FeBlend", nxex.graph.filter.Filter, {
        view: {
            tag: "svg:feBlend"
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
