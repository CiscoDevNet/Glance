(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class FePointLight
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.filter.FePointLight", nxex.graph.filter.Filter, {
        view: {
            tag: "svg:fePointLight"
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
