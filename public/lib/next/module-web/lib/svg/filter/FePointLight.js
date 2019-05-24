(function (nx) {
    /**
     * @class FePointLight
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FePointLight", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("fePointLight", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
