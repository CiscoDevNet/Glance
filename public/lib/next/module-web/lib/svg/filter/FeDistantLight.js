(function (nx) {
    /**
     * @class FeDistantLight
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeDistantLight", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feDistantLight", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
