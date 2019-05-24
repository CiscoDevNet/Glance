(function (nx) {
    /**
     * @class FeConvolveMatrix
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeConvolveMatrix", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feConvolveMatrix", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
