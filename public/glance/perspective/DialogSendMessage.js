(function(nx) {
    var EXPORT = nx.define("glance.perspective.DialogSendMessage", glance.common.Dialog, {
        view: {
            cssclass: "glance-dialog-send-message",
            extend: {
                body: {
                    content: [{
                        name: "header",
                        cssclass: "header",
                        content: [{
                            cssclass: "header-button",
                            capture: {
                                tap: function() {
                                    this.fire("backward", this.model());
                                }
                            }
                        }, {
                            cssclass: "header-title",
                            content: "Send a Message"
                        }]

                    }, {
                        name: "input-pannel",
                        cssclass: "input-pannel",
                        content: "{message}"
                    }, {
                        name: "mock-keybord",
                        type: "glance.perspective.search.Keyboard",
                        cssclass: "mock-keybord",
                        events: {
                            input: "{input}",
                            backspace: "{backspace}"
                        }
                    }, {
                        cssclass: "button-group",
                        content: {
                            repeat: "sendingMethods",
                            cssclass: "button enable-{enable}",
                            properties: {
                                sendType: "{scope.model.type}",
                                sendReceiver: nx.binding("scope.model.path", function(path) {
                                    return path && nx.binding("scope.context.model." + path);
                                }),
                                enable: nx.binding("sendReceiver, scope.context.message", function(sendReceiver, message) {
                                    return !!sendReceiver && !!message;
                                })
                            },
                            attributes: {
                                sendReceiver: nx.binding("scope.model.path", function(path) {
                                    return path && nx.binding("scope.context.model." + path);
                                })
                            },
                            content: ["Send by ", "{scope.model.name}"],
                            capture: {
                                tap: function(sender, evt) {
                                    if (sender.hasClass("enable-true")) {
                                        var type = nx.path(sender, "sendType");
                                        var receiver = nx.path(sender, "sendReceiver");
                                        var message = nx.path(sender, "scope.context.message");
                                        var url = glance.service.api.getSendMessageUrl(type, receiver, message);
                                        nx.util.ajax({
                                            url: url,
                                            success: function() {
                                                nx.path(this, "scope.context.message", "");
                                                nx.path(this, "scope.context.result", "Message sent.");
                                            }.bind(this),
                                            error: function() {
                                                nx.path(this, "scope.context.result", "Sending message failed.");
                                            }.bind(this)
                                        });
                                    }
                                }
                            }
                        }
                    }, {
                        cssclass: "button button-close",
                        content: "Close Window",
                        capture: {
                            tap: function() {
                                this.fire("close", false);
                            }
                        }
                    }, {
                        cssclass: "result",
                        attributes: {
                            result: "{result}"
                        },
                        content: [{
                            cssclass: "result-message",
                            content: "{result}"
                        }, {
                            cssclass: "button",
                            content: "OK",
                            capture: {
                                tap: function() {
                                    this.fire("backward", this.model());
                                }
                            }
                        }]
                    }]
                }
            }
        },
        properties: {
            model: null,
            message: "",
            result: "",
            sendingMethods: function() {
                return [{
                    type: "sms",
                    path: "phoneNumber",
                    name: "SMS"
                }, {
                    type: "spark",
                    path: "email",
                    name: "Spark"
                }]
            }
        },
        methods: {
            input: function(sender, evt) {
                if (this.message()) {
                    this.message(this.message() + evt.text.toLowerCase());
                } else {
                    this.message(this.message() + evt.text);
                }
            },
            backspace: function() {
                var message = this.message();
                if (message) {
                    message = message.substring(0, message.length - 1);
                    this.message(message);
                    if (!message && this._backspace_timer) {
                        clearInterval(this._backspace_timer);
                        this._backspace_timer = null;
                    }
                }
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-dialog-send-message > .body > .header": {
                    "width": "100%",
                    "color": "#333",
                    "height": "3em",
		    "border-bottom":"1px solid #e7e7e7"
                },
                ".glance-dialog-send-message > .body > .header > .header-button": {
                    "text-align": "center",
                    "box-sizing": "border-box",
                    "width": "3em",
                    "height": "3em",
                    "float": "left",
                    "border-right": "1px solid #e7e7e7"
                },
                ".glance-dialog-send-message > .body > .header > .header-button:after": {
                    "content": "\\f060",
                    "font-family": "FontAwesome",
                    "font-size": "1em",
                    "width": "100%",
                    "height": "3em",
                    "text-align": "center",
                    "line-height": "3em"
                },
                ".glance-dialog-send-message > .body > .header > .header-title": {
                    "width": "22em",
                    "box-sizing": "border-box",
                    "font-size": "1em",
                    "padding-left": "1em",
                    "float": "left",
                    "height": "3em",
                    "line-height": "3em"
                },
                ".glance-dialog-send-message > .body > .input-pannel": {
                    "height": "5em",
                    "margin": "1em",
                    "padding": "1em",
                    "border": "1px solid #dddddd",
                    "box-sizing": "border-box"
                },
                ".glance-dialog-send-message > .body > .mock-keybord": {
                    "font-size": "1em",
                    "margin": "0em 1em"
                },
                ".glance-dialog-send-message > .body > .mock-keybord  > nx-element": {
                    "line-height": "1.5em",
                    "height": "1.5em"
                },
                ".glance-dialog-send-message > .body > .mock-keybord  > nx-element:first-child > nx-element:last-child:after": {
                    "color": "#b3b3b3"
                },
                ".glance-dialog-send-message > .body > .glance-keyboard > nx-element:last-child > nx-element:last-child:before": {
                    "margin": ".5em",
                    "color": "#b3b3b3"
                },
                ".glance-dialog-send-message > .body > .button-group": {
                    "display": "flex",
                    "justify-content": "space-between",
                    "margin": "1em"
                },
                ".glance-dialog-send-message > .body > .button-group > .button": {
                    "width": "1px",
                    "flex-grow": "1",
                    "text-align": "center",
                    "padding": ".2em",
                    "border-radius": ".3em",
                },
                ".glance-dialog-send-message > .body > .button-group > .button:not(:first-child)": {
                    "margin-left": "1em"
                },
                ".glance-dialog-send-message > .body > .button-group > .button:not(.enable-false)": {
                    "cursor": "default",
                    "color": "white",
                    "background": "#cd0101"
                },
                ".glance-dialog-send-message > .body > .button-group > .button:not(.enable-false):hover": {
                    "opacity": ".5"
                },
                ".glance-dialog-send-message > .body > .button": {
                    "text-align": "center",
                    "margin": "1em",
                    "padding": ".2em",
                    "border-radius": ".3em",
                    "cursor": "default"
                },
                ".glance-dialog-send-message > .body > .button-close": {
                    "color": "black",
                    "background": "#ccc"
                },
                ".glance-dialog-send-message > .body > .button.button-default": {
                    "display": "inline-block",
                    "width": "50%",
                    "color": "white",
                    "background": "#e7e7e7"
                },
                ".glance-dialog-send-message > .body > .result": {
                    "nx:absolute": "3em 0 0 0",
                    "background": "rgba(0,0,0,.7)"
                },
                ".glance-dialog-send-message > .body > .result[result='']": {
                    "display": "none"
                },
                ".glance-dialog-send-message > .body > .result > .result-message": {
                    "margin": "1em",
                    "text-align": "center"
                },
                ".glance-dialog-send-message > .body > .result > .button": {
                    "text-align": "center",
                    "margin": "1em",
                    "padding": ".2em",
                    "border-radius": ".3em",
                    "cursor": "default",
                    "color": "white",
                    "background": "#cd0101"
                },
                ".glance-dialog-send-message > .body > .result > .button:hover": {
                    "opacity": ".5"
                }
            })
        }
    });
})(nx);
