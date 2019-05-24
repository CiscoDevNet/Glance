(function(nx) {
    var EXPORT = nx.define("nx.lib.component.NormalInput", nx.ui.Element, {
        view: {
            cssclass: "nx-normal-input",
            content: {
                name: "input",
                type: "nx.ui.tag.Input",
                attributes: {
                    value: nx.binding("value", true, function(setter, value) {
                        if (value !== this.input().dom().value) {
                            this.input().dom().value = value;
                        }
                    }),
                    id: nx.binding("id"),
                    name: nx.binding("name"),
                    placeholder: nx.binding("placeholder"),
                    readonly: nx.binding("readonly"),
                    type: nx.binding("password", function(password) {
                        return password ? "password" : "text";
                    })
                },
                events: {
                    input: function(sender, evt) {
                        // TODO better monitor
                        this.value(this.input().dom().value);
                        this.fire("input", evt);
                    }
                }
            }
        },
        properties: {
            id: null,
            value: null,
            name: null,
            placeholder: null,
            readonly: false,
            password: false
        },
        methods: {
            focus: function() {
                this.input().dom().focus();
            },
            blur: function() {
                this.input().dom().blur();
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".nx-normal-input": {
                    "position": "relative",
                    "overflow": "hidden"
                },
                ".nx-normal-input > input": {
                    "position": "absolute",
                    "background": "transparent",
                    "left": "0",
                    "top": "0",
                    "width": "100%",
                    "height": "100%",
                    "line-height": "inherit",
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
