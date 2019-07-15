(function (nx) {
    /**
     * @class InputHidden
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("nx.ui.tag.InputHidden", nx.ui.tag.Input, {
        view: {
            attributes: {
                type: "hidden"
            }
        }
    });
})(nx);
