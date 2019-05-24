(function (nx) {
    /**
     * @class Input
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.Table", nx.ui.Element, {
        methods: {
            init: function () {
                this.inherited("table");
            }
        },
        properties: {
            childDefaultType: {
                value: function () {
                    return nx.ui.tag.TableRow;
                }
            }
        }
    });
})(nx);
