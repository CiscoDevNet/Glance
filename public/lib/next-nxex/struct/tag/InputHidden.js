(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class InputHidden
     * @namespace nxex.struct.tag
     */
    var EXPORT = nx.define("nxex.struct.tag.InputHidden", nxex.struct.tag.Input, {
        struct: {
            properties: {
                type: "hidden"
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
