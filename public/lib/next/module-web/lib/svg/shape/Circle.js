(function (nx) {
    /**
     * @class Circle
     * @extends nx.lib.svg.shape.Path
     * @namespace nx.lib.svg
     */
    var EXPORT = nx.define("nx.lib.svg.shape.Circle", nx.lib.svg.Node, {
        methods: {
            init: function () {
                this.inherited("circle");
            }
        }
    });
})(nx);
