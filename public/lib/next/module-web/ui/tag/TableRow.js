(function (nx) {
    /**
     * @class Input
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.TableRow", nx.ui.Element, {
        methods: {
            init: function () {
                this.inherited("tr");
            }
        },
        properties: {
            childDefaultType: {
                value: function () {
                    return nx.ui.tag.TableCell;
                }
            }
        }
    });
})(nx);
