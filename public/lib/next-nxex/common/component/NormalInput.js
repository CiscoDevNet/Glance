(function (nx, ui, toolkit, annotation, global) {
    var template = nxex.struct.Template.template,
        binding = nxex.struct.Binding.binding;
    var EXPORT = nx.define("nxex.common.component.NormalInput", nxex.struct.Element, {
        events: ["input", "change"],
        struct: {
            properties: {
                class: ["nxex-normal-input"]
            },
            content: {
                name: "input",
                type: "nxex.struct.tag.Input",
                properties: {
                    value: binding("value", true, function (setter, value) {
                        if (value !== this.input().get("value")) {
                            setter(value);
                        }
                    }),
                    id: binding("id"),
                    name: binding("name"),
                    placeholder: binding("placeholder")
                },
                events: {
                    input: function (sender, evt) {
                        this.value(this.input().get("value"));
                    }
                }
            }
        },
        properties: {
            id: "",
            value: "",
            name: "",
            placeholder: ""
        },
        methods: {
            focus: function () {
                this.input().dom().$dom.focus();
            },
            blur: function () {
                this.input().dom().$dom.blur();
            }
        },
        statics: {
            CSS: toolkit.css({
                ".nxex-normal-input": {
                    "position": "relative",
                    "overflow": "hidden"
                },
                ".nxex-normal-input > input": {
                    "position": "absolute",
                    "left": "0",
                    "top": "0",
                    "width": "100%",
                    "height": "100%",
                    "outline": "none",
                    "border": "0",
                    "border-radius": "inherit",
                    "text-indent": "inherit",
                    "font-size": "inherit",
                    "font-weight": "inherit",
                    "background": "transparent"
                }
            })
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
