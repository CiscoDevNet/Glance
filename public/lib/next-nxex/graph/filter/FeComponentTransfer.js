(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class FeComponentTransfer
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.filter.FeComponentTransfer", nxex.graph.filter.Filter, {
        view: {
            tag: "svg:feComponentTransfer"
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
