(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class InputRadio
     * @namespace nxex.struct.tag
     */
    var EXPORT = nx.define("nxex.struct.tag.InputRadio", nxex.struct.tag.Input, {
        struct: {
            properties: {
                type: "radio"
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
