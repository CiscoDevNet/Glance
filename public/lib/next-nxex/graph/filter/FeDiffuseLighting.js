(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class FeDiffuseLighting
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.filter.FeDiffuseLighting", nxex.graph.filter.Filter, {
        view: {
            tag: "svg:feDiffuseLighting"
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
