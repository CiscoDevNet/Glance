(function (nx) {
    /**
     * @class InputFile
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.InputFile", nx.ui.tag.Input, {
        view: {
            attributes: {
                type: "file"
            },
            events: {
                change: function (sender, evt) {
                    // FIXME Chrome: it will not catch "reset" event of form
                    this.value(this.dom().value);
                }
            }
        },
        properties: {
            value: ""
        }
    });
})(nx);
