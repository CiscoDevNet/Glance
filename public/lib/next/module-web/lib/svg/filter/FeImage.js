(function (nx) {
    /**
     * @class FeImage
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeImage", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feImage", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
