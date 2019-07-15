(function (nx) {
    /**
     * @class FeDiffuseLighting
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeDiffuseLighting", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feDiffuseLighting", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
