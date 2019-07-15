(function (nx) {
    /**
     * @class FeGaussianBlur
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeGaussianBlur", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feGaussianBlur", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
