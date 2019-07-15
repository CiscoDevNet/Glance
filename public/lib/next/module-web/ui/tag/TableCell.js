(function (nx) {
    /**
     * @class Input
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.TableCell", nx.ui.Element, {
        methods: {
            init: function () {
                this.inherited("td");
            }
        }
    });
})(nx);
