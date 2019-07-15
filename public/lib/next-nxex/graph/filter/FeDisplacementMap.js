(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class FeDisplacementMap
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.filter.FeDisplacementMap", nxex.graph.filter.Filter, {
        view: {
            tag: "svg:feDisplacementMap"
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
