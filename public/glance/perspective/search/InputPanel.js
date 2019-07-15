(function(nx) {
    var binding = nx.binding;
    var EXPORT = nx.define("glance.perspective.search.InputPanel", nx.ui.Element, {
        view: {
            cssclass: ["input-panel", binding("inputMethod", function(method) {
                return "input-method-" + method;
            })],
            content: [{
                cssclass: "input",
                content: {
                    content: binding("word")
                }
            }, {
                type: "glance.common.IconClear",
                cssclass: "clear",
                capture: {
                    tap: function() {
                        if (this.word()) {
                            this.clear();
                        } else {
                            this.fire("close");
                        }
                    }
                }
            }, {
                type: "glance.perspective.search.Keyboard",
                cssclass: "input-area input-area-keyboard",
                events: {
                    input: "{input}",
                    backspace: "{backspace}"
                }
            }]
        },
        properties: {
            inputMethod: "keyboard",
            word: ""
        },
        methods: {
            input: function(sender, evt) {
                this.word(this.word() + evt.text);
            },
            backspace: function() {
                var word = this.word();
                if (word) {
                    word = word.substring(0, word.length - 1);
                    this.word(word);
                    if (!word && this._backspace_timer) {
                        clearInterval(this._backspace_timer);
                        this._backspace_timer = null;
                    }
                }
            },
            clear: function() {
                this.word("");
            },
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".input-panel": {
                    "position": "relative",
                    "color": "#333",

                },
                ".input-panel > .backspace": {
                    "position": "absolute",
                    "top": ".5em",
                    "height": "1.3em",
                    "right": "1.5em"
                },
                ".input-panel > .clear": {
                    "position": "absolute",
                    "top": ".5em",
                    "width": "1.3em",
                    "height": "1.3em",
                    "right": "0em"
                },
                ".input-panel > .input": {
                    "height": "2em",
                    "line-height": "2em",
                    "border-bottom": ".1em solid #b3b3b3"
                },
                ".input-panel > .input > nx-element": {
                    "overflow": "hidden",
                    "white-space": "nowrap",
                    "text-overflow": "ellipsis",
                    "margin-right": "3em",
                    "padding": "0 0 0 1em",
                    "color": "#b3b3b3"
                },
                ".input-panel > .input > nx-element:before": {
                    "content": "\\f002",
                    "font-family": "FontAwesome",
                    "margin-right": ".5em"
                },
                ".input-panel > .input-area": {
                    "nx:absolute": "2.7em 0 0 0"
                },
                ".input-panel:not(.input-method-hand) > .input-area-hand": {
                    "display": "none"
                },
                ".input-panel:not(.input-method-keyboard) > .input-area-keyboard": {
                    "display": "none"
                },
                ".input-panel > .footer": {
                    "position": "absolute",
                    "text-align": "center",
                    "left": "0px",
                    "right": "0px",
                    "bottom": "0px",
                    "height": "2em",
                    "line-height": "2em"
                },
                ".input-panel > .footer > nx-element": {
                    "display": "inline"
                },
                ".input-panel.input-method-hand .input-switcher-hand": {
                    "color": "#cd0101"
                },
                ".input-panel.input-method-keyboard .input-switcher-keyboard": {
                    "color": "#cd0101"
                },
                ".input-panel > .matched-list-container": {
                    "position": "absolute",
                    "background-color": "white",
                    "left": ".5em",
                    "right": ".5em",
                    "bottom": "120%",
                    "max-height": "8em",
                    "padding": ".5em .5em 0 .5em"
                },
                ".input-panel > .matched-list-container > .matched-list": {
                    "position": "relative",
                    "max-height": "7.5em",
                    "overflow-y": "auto",
                    "overflow-x": "hidden"
                },
                ".input-panel > .matched-list-container > .matched-list > nx-element": {
                    "line-height": "2em"
                }
            })
        }
    });
})(nx);
