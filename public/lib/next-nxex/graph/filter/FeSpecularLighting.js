(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class FeSpecularLighting
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.filter.FeSpecularLighting", nxex.graph.filter.Filter, {
        view: {
            tag: "svg:feSpecularLighting"
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
