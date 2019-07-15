(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class FeImage
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.filter.FeImage", nxex.graph.filter.Filter, {
        view: {
            tag: "svg:feImage"
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
