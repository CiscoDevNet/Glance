(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class FeGaussianBlur
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.filter.FeGaussianBlur", nxex.graph.filter.Filter, {
        view: {
            tag: "svg:feGaussianBlur"
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
