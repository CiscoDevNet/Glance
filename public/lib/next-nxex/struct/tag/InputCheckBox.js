(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class InputCheckBox
     * @namespace nxex.struct.tag
     */
    var EXPORT = nx.define("nxex.struct.tag.InputCheckBox", nxex.struct.tag.Input, {
        struct: {
            properties: {
                type: "checkbox"
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
