(function (nx) {
    /**
     * @class FeBlend
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeBlend", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feBlend", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
