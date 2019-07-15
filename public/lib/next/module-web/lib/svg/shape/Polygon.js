(function (nx) {

    /**
     * @class Polygon
     * @extends nx.lib.svg.Node
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.shape.Polygon", nx.lib.svg.Node, {
        methods: {
            init: function () {
                this.inherited("polygon");
            }
        }
    });
})(nx);
