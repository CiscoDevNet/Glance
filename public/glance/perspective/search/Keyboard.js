(function(nx) {
    var EXPORT = nx.define("glance.perspective.search.Keyboard", nx.ui.Element, {
        view: {
            cssclass: ["glance-keyboard"],
            content: {
                repeat: "{layout}",
                content: {
                    repeat: "{scope.model}",
                    content: nx.binding("scope.model", function(char) {
                        return char === "\b" ? "&nbsp" : char;
                    }),
                    events: {
                        "mousedown touchstart": function(sender, evt) {
                            this.addClass("active");
                            evt.capture(this, ["tap", "end"]);
                        },
                        capturetap: function() {
                            var char = this.scope().model();
                            if (char === "\b") {
                                this.scope().context().scope().context().fire("backspace");
                            } else {
                                this.scope().context().scope().context().fire("input", {
                                    type: "text",
                                    text: char
                                });
                            }

                        },
                        captureend: function(sender) {
                            this.removeClass("active");
                        }
                    }
                }
            }
        },
        properties: {
            layout: {
                value: function() {
                    return nx.array.query({
                        array: ["1234567890\b", "QWERTYUIOP.", "ASDFGHJKL,", "ZXCVBNM? "],
                        mapping: function(row) {
                            return row.split("");
                        }
                    });
                }
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-keyboard": {
                    "display": "flex",
                    "flex-direction": "column",
                    "justify-content": "center"
                },
                ".glance-keyboard > nx-element": {
                    "height": "2.5em",
                    "line-height": "2.5em",
                    "display": "flex",
                    "justify-content": "center"
                },
                ".glance-keyboard > nx-element > nx-element": {
                    "width": "10%",
                    "text-align": "center",
                    "background": "#ddd",
                    "display": "flex",
                    "justify-content": "center",
                    "margin-left": ".1em"
                },
                ".glance-keyboard > nx-element > nx-element:last-child": {
                    "margin-right": ".1em"
                },
                ".glance-keyboard > nx-element:first-child > nx-element": {
                    "width": "9%",
                    "top": ".1em"
                },
                ".glance-keyboard > nx-element:first-child > nx-element:last-child": {
                    "color": "transparent"
                },
                ".glance-keyboard > nx-element:first-child > nx-element:last-child:after": {
                    "content": "\\f060",
                    "font-family": "FontAwesome",
                    "color": "#333",
                    "display": "inline-block",
                    "width": "100%",
                    "text-align": "center",
                    "margin-right": ".3em"

                },
                ".glance-keyboard > nx-element:nth-child(2) > nx-element": {
                    "margin-top": ".1em",
                    "margin-bottom": ".1em"
                },
                ".glance-keyboard > nx-element:nth-child(3) > nx-element": {
                    "margin-bottom": ".1em"
                },
                ".glance-keyboard > nx-element:nth-child(4) > nx-element": {
                    "margin-bottom": ".1em"
                },
                ".glance-keyboard > nx-element:last-child > nx-element:last-child:before": {
                    "content": " ",
                    "display": "inline-block",
                    "margin-top": "1em",
                    "width": ".8em",
                    "height": ".2em",
                    "border-width": "0 .2em .2em",
                    "border-style": "solid"
                },
                ".glance-keyboard > nx-element > nx-element.active": {
                    "background": "#e7e7e7"
                }
            })
        }
    });
})(nx);
