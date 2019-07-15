(function (nx) {
    /**
     * @class Input
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.Input", nx.ui.Element, {
        methods: {
            init: function () {
                this.inherited("input");
            },
            focus: function () {
                return this.dom().focus();
            },
            blur: function () {
                return this.dom().blur();
            }
        }
    });
})(nx);
