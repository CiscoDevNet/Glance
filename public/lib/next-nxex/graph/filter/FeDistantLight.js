(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class FeDistantLight
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.filter.FeDistantLight", nxex.graph.filter.Filter, {
        view: {
            tag: "svg:feDistantLight"
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
