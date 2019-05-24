(function (nx) {
    /**
     * @class FeOffset
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeOffset", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feOffset", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
