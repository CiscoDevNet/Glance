(function (nx) {
    /**
     * @class FileLabel
     * @extends nx.ui.tag.Label
     */
    var EXPORT = nx.define("nx.lib.component.FileLabel", nx.ui.tag.Label, {
        view: {
            attributes: {
                "for": nx.binding("name"),
                class: ["nx-file-label", nx.binding("disabled", function (disabled) {
                    return disabled ? "disabled" : false;
                })]
            },
            content: [{
                name: "input",
                type: "nx.ui.tag.InputFile",
                attributes: {
                    id: nx.binding("name"),
                    name: nx.binding("name"),
                    accept: nx.binding("accept"),
                    disabled: nx.binding("disabled", function (disabled) {
                        return disabled ? "disabled" : false;
                    })
                },
                events: {
                    change: function () {
                        this.fire("change", this.input().dom());
                    }
                }
            }]
        },
        properties: {
            name: "",
            accept: "",
            disabled: false
        }
    });
})(nx);
