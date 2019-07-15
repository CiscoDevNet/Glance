(function(nx) {

    var ConfirmDialog = nx.define(glance.common.Dialog, {
        view: {
            cssclass: "glance-dialog-confirm",
            extend: {
                body: {
                    content: [{
                        cssclass: "message",
                        content: "{message}"
                    }, {
                        cssclass: "footer",
                        content: [{
                            cssclass: "button button-ok",
                            content: "OK",
                            capture: {
                                tap: function() {
                                    this.fire("close", true);
                                }
                            }
                        }, {
                            cssclass: "button button-cancel",
                            content: "Cancel",
                            capture: {
                                tap: function() {
                                    this.fire("close", false);
                                }
                            }
                        }]
                    }]
                }
            }
        },
        properties: {
            message: ""
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-dialog-confirm > .body > .message": {
                    "padding": "1em",
                    "text-align": "center"
                },
                ".glance-dialog-confirm > .body > .footer": {
                    "text-align": "center",
                    "padding": "0 1em 1em"
                },
                ".glance-dialog-confirm > .body > .footer > .button": {
                    "position": "relative",
                    "display": "inline-block",
                    "margin": "0 1em",
                    "padding": ".2em",
                    "border": "1px solid #ccc",
                    "border-radius": ".2em",
                    "min-width": "4em",
                    "text-align": "center",
                    "overflow": "hidden"
                },
                ".glance-dialog-confirm > .body > .footer > .button:hover:before": {
                    "content": " ",
                    "nx:absolute": "0",
                    "background": "rgba(0,0,0,.2)"
                }
            })
        }
    });

    var PromptDialog = nx.define(glance.common.Dialog, {
        view: {
            cssclass: "glance-dialog-prompt",
            extend: {
                body: {
                    content: [{
                        cssclass: "message",
                        content: "{message}"
                    }, {
                        name: "inputField",
                        type: "nx.lib.component.NormalInput",
                        cssclass: "input",
                        properties: {
                            value: "{value}"
                        }
                    }, {
                        cssclass: "footer",
                        content: [{
                            cssclass: "button button-ok",
                            content: "OK",
                            capture: {
                                tap: function() {
                                    this.fire("close", nx.path(this, "inputField.value"));
                                }
                            }
                        }, {
                            cssclass: "button button-cancel",
                            content: "Cancel",
                            capture: {
                                tap: function() {
                                    this.fire("close", false);
                                }
                            }
                        }]
                    }]
                }
            }
        },
        properties: {
            message: "",
            value: ""
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-dialog-prompt > .body > .message": {
                    "padding": "1em",
                    "text-align": "center"
                },
                ".glance-dialog-prompt > .body > .input": {
                    "margin": "auto 1em 1em",
                    "border": "1px solid #ccc",
                    "height": "2em"
                },
                ".glance-dialog-prompt > .body > .input:focus": {
                    "background": "#fff"
                },
                ".glance-dialog-prompt > .body > .input > input": {
                    "padding": ".5em",
                    "box-sizing": "border-box"
                },
                ".glance-dialog-prompt > .body > .footer": {
                    "text-align": "center",
                    "padding": "0 1em 1em"
                },
                ".glance-dialog-prompt > .body > .footer > .button": {
                    "position": "relative",
                    "display": "inline-block",
                    "margin": "0 1em",
                    "padding": ".2em",
                    "border": "1px solid #ccc",
                    "border-radius": ".2em",
                    "min-width": "4em",
                    "text-align": "center",
                    "overflow": "hidden"
                },
                ".glance-dialog-prompt > .body > .footer > .button:hover:before": {
                    "content": " ",
                    "nx:absolute": "0",
                    "background": "rgba(0,0,0,.2)"
                }
            })
        }
    });

    var EXPORT = nx.define("glance.common.DialogUtil", nx.ui.Element, {
        statics: {
            confirm: function(message, callback) {
                var dialog = new ConfirmDialog();
                dialog.message(message);
                dialog.on("close", function(sender, result) {
                    dialog.release();
                    callback(result);
                });
                dialog.retain(dialog.appendTo());
            },
            prompt: function(message, value, callback) {
                var dialog = new PromptDialog();
                dialog.message(message);
                dialog.value(value);
                dialog.on("close", function(sender, result) {
                    dialog.release();
                    callback(result);
                });
                dialog.retain(dialog.appendTo());
            }
        }
    });

})(nx);
