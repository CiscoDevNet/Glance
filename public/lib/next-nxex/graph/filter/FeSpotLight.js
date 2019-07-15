(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class FeSpotLight
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.filter.FeSpotLight", nxex.graph.filter.Filter, {
        view: {
            tag: "svg:feSpotLight"
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
