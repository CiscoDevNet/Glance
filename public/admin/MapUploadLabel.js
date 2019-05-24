(function(nx) {
    /**
     * @class Label
     * @namespace nx.ui.tag
     */
    var EXPORT = nx.define("devme.admin.MapUploadLabel", nx.lib.component.FileLabel, {
        view: {
            cssclass: ["glance-upload-image", nx.binding("input.value", function(value) {
                return value ? "" : "missing";
            })],
            content: [{
                cssclass: "prompt",
                content: nx.binding("prompt")
            }, {
                cssclass: "indicator",
                attributes: {
                    title: nx.binding("value")
                },
                content: nx.binding("value, empty", function(value, empty) {
                    if (value) {
                        if (value.lastIndexOf("/") >= 0) {
                            value = value.substring(value.lastIndexOf("/") + 1);
                        }
                        if (value.lastIndexOf("\\") >= 0) {
                            value = value.substring(value.lastIndexOf("\\") + 1);
                        }
                        return value;
                    }
                    return empty || "(Required)";
                })
            }]
        },
        properties: {
            value: {
                dependencies: "input.value"
            },
            prompt: "",
            empty: "(Required)"
        },
        methods: {
            reset: function() {
                // FIXME work around for browser defect
                this.input().dom().value = "";
                this.input().value("");
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-upload-image": {
                    "display": "block",
                    "position": "relative",
                    "height": "2em",
                    "line-height": "2em",
                    "margin": "1em auto",
                    "border": "1px solid transparent",
                    "border-radius": ".2em",
                    "color": "#666",
                    "font-weight": "300"
                },
                ".glance-upload-image:hover": {
                    "border-color": "#666"
                },
                ".glance-upload-image:active": {
                    "background": "#666",
                    "color": "white"
                },
                ".glance-upload-image > input": {
                    "width": "0",
                    "height": "0"
                },
                ".glance-upload-image > *": {
                    "font-size": ".7em"
                },
                ".glance-upload-image > .prompt": {
                    "position": "relative",
                    "box-sizing": "border-box",
                    "display": "inline-block",
                    "width": "25%",
                    "padding-left": ".5em",
                    "vertical-align": "top"
                },
                ".glance-upload-image > .indicator": {
                    "position": "relative",
                    "box-sizing": "border-box",
                    "display": "inline-block",
                    "width": "75%",
                    "overflow": "hidden",
                    "white-space": "nowrap",
                    "text-overflow": "ellipsis",
                    "vertical-align": "top"
                },
                ".glance-upload-image.missing > .indicator": {
                    "color": "red"
                }
            })
        }
    });
})(nx);
