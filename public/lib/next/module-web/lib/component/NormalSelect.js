(function(nx) {
    var EXPORT = nx.define("nx.lib.component.NormalSelect", nx.ui.Element, {
        view: {
            cssclass: "nx-normal-select",
            content: {
                name: "select",
                type: "nx.ui.tag.Select",
                attributes: {
                    id: "{id}",
                    name: "{name}",
                    readonly: nx.binding("readonly")
                },
                content: {
                    repeat: "{options}",
                    type: "nx.ui.tag.SelectOption",
                    attributes: {
                        value: "{scope.model.value}",
                        selected: nx.binding("scope.context.value, scope.model.value", function(value, ovalue) {
                            if (nx.is(value, "Number") || nx.is(value, "Boolean")) {
                                value = "" + value;
                            }
                            return value === ovalue && "selected";
                        })
                    },
                    content: "{scope.model.text}"
                }
            }
        },
        properties: {
            id: null,
            name: null,
            value: null,
            options: null,
            readonly: false
        },
        methods: {
            focus: function() {
                this.select().dom().focus();
            },
            blur: function() {
                this.select().dom().blur();
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".nx-normal-select": {
                    "position": "relative",
                    "overflow": "hidden"
                },
                ".nx-normal-select > select": {
                    "position": "absolute",
                    "background": "transparent",
                    "left": "0",
                    "top": "0",
                    "width": "100%",
                    "height": "100%",
                    "outline": "none",
                    "border": "0",
                    "border-radius": "inherit",
                    "text-indent": "inherit",
                    "font-family": "inherit",
                    "font-size": "inherit",
                    "font-weight": "inherit"
                }
            })
        }
    });
})(nx);
