(function (nx) {
    /**
     * @class FeFlood
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeFlood", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feFlood", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
