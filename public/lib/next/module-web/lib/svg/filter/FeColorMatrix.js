(function (nx) {
    /**
     * @class FeColorMatrix
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeColorMatrix", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feColorMatrix", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
