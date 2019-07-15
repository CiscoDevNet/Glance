(function (nx, ui, toolkit, annotation, global) {
    var template = nxex.struct.Template.template,
        binding = nxex.struct.Binding.binding;
    /**
     * @class Label
     * @namespace nxex.struct.tag
     */
    var EXPORT = nx.define("nxex.common.component.FileLabel", nxex.struct.tag.Label, {
        struct: {
            properties: {
                "for": binding("name"),
                class: ["nxex-file-label", binding("disabled", function (disabled) {
                    return disabled ? "disabled" : false;
                })]
            },
            content: [{
                name: "input",
                type: "nxex.struct.tag.InputFile",
                properties: {
                    id: binding("name"),
                    name: binding("name"),
                    accept: binding("accept"),
                    disabled: binding("disabled", function (disabled) {
                        return disabled ? "disabled" : false;
                    })
                }
            }]
        },
        properties: {
            name: "",
            accept: "",
            disabled: false
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
