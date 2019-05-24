(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class InputButton
     * @namespace nxex.struct.tag
     */
    var EXPORT = nx.define("nxex.struct.tag.InputButton", nxex.struct.tag.Input, {
        struct: {
            properties: {
                type: "button"
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
