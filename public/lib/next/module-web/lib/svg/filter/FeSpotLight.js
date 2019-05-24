(function (nx) {
    /**
     * @class FeSpotLight
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeSpotLight", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feSpotLight", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
