(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class FeComposite
     * @namespace nxex.graph.filter
     */
    var EXPORT = nx.define("nxex.graph.filter.FeComposite", nxex.graph.filter.Filter, {
        view: {
            tag: "svg:feComposite"
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
