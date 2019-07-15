(function (nx) {
    /**
     * @class FeComponentTransfer
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeComponentTransfer", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feComponentTransfer", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
