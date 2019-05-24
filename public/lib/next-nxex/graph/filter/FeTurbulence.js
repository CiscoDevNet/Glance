(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class FeTurbulence
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.filter.FeTurbulence", nxex.graph.filter.Filter, {
        view: {
            tag: "svg:feTurbulence"
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
