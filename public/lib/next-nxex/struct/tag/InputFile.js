(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class InputFile
     * @namespace nxex.struct.tag
     */
    var EXPORT = nx.define("nxex.struct.tag.InputFile", nxex.struct.tag.Input, {
        struct: {
            properties: {
                type: "file"
            },
            events: {
                change: function (sender, evt) {
		    // FIXME Chrome: it will not catch "reset" event of form
                    this.value(this.dom().$dom.value);
                }
            }
        },
        properties: {
            value: ""
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
