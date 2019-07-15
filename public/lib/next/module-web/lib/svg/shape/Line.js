(function (nx) {

    // short cuts of functions

    /**
     * @class Path
     * @extends nx.lib.svg.Node
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.shape.Line", nx.lib.svg.Node, {
        methods: {
            init: function () {
                this.inherited("line");
            }
        }
    });
})(nx);
