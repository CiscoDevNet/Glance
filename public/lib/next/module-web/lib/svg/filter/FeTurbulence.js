(function (nx) {
    /**
     * @class FeTurbulence
     * @namespace nx.lib.svg.filter
     */
    var EXPORT = nx.define("nx.lib.svg.filter.FeTurbulence", nx.lib.svg.filter.Filter, {
        methods: {
            init: function () {
                this.inherited("feTurbulence", "http://www.w3.org/2000/svg");
            }
        }
    });
})(nx);
