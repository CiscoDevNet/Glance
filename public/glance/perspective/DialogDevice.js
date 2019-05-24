(function(nx) {
    var EXPORT = nx.define("glance.perspective.DialogDevice", glance.common.Dialog, {
        view: {
            cssclass: "glance-dialog-device category-{model.category} routable-{routable} isme-{model.isme} isroute-{model.isroute}",
            extend: {
                body: {
                    content: [{
                        name: "header",
                        cssclass: "header"
                    }, {
                        name: "deviceIcon",
                        cssclass: "deviceIcon"
                    }, {
                        name: "deviceName",
                        cssclass: "deviceName"
                    }, {
                        name: "deviceOwner",
                        cssclass: "deviceOwner",
                        content: [{
                            name: "headerText",
                            cssclass: "headerText",
                            content: "DEVICE OWNER"
                        }, {
                            name: "portrait",
                            type: "nx.lib.component.CentralizedImage",
                            cssclass: "portrait"

                        }, {
                            name: "title",
                            cssclass: "title"
                        }, {
                            name: "subtitle",
                            cssclass: "subtitle"
                        }, {
                            cssclass: "button button-view button-default",
                            content: "View Profile",
                            capture: {
                                tap: function() {
                                    //return to DialogProfileDetail
                                    // console.log(this.model());
                                    this.fire("viewProfile", this.model());
                                }
                            }
                        }, {
                            cssclass: "button button-send button-default",
                            content: "Send Message",
                            capture: {
                                tap: function() {
                                    this.fire("sendMessage", this.model());
                                }
                            }
                        }]
                    }, {
                        cssclass: "button button-navigate button-default button-route button-route-true",
                        content: "Navigate",
                        capture: {
                            tap: function(sender) {
                                this.fire("navigate", true);
                            }
                        }
                    }, {
                        cssclass: "button button-stop button-route button-route-false",
                        content: "Stop Navigating",
                        capture: {
                            tap: function() {
                                this.fire("navigate", false);
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
                    }]
                }
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-dialog-device > .body > .header": {
                    "width": "100%",
                    "color": "#333",
                    "height": "3em",
                    "box-sizing": "border-box",
                    "padding-left": "6em",
                    "padding-top": "1.5em",
                    "background": "#f7f7f7",
                    "border-bottom": "1px solid #e7e7e7"
                },
                ".glance-dialog-device > .body > .deviceIcon": {
                    "position": "absolute",
                    "left": "0",
                    "top": "0",
                    "margin": "1em",
                    "width": "4em",
                    "height": "4em",
                    "border-radius": "50%",
                    "background": "white"
                },
                ".glance-dialog-device > .body > .deviceIcon:before": {
                    "content": "\\f10b",
                    "font-family": "FontAwesome",
                    "color": "#333",
                    "display": "inline-block",
                    "width": "100%",
                    "text-align": "center",
                    "font-size": "3.3em",
                    "padding-top": ".1em"
                },
                ".glance-dialog-device > .body > .deviceName": {
                    "padding-left": "6em",
                    "margin-top": ".3em",
                    "color": "#cd0101",
                    "font-weight": "lighter"
                },
                ".glance-dialog-device > .body > .deviceOwner": {
                    "border": "1px solid #e7e7e7",
                    "margin": "1em",
                    "margin-top": "2em",
                    "position": "relative",
                    "min-height": "6em"
                },

                ".glance-dialog-device > .body > .deviceOwner > .headerText": {
                    "border": "1px solid #e7e7e7",
                    "width": "8em",
                    "text-align": "center",
                    "margin-top": "-.7em",
                    "margin-left": "1.1em",
                    "color": "#666",
                    "font-size": ".8em",
                    "background": "white"
                },

                ".glance-dialog-device > .body > .deviceOwner > .title": {
                    "margin-left": "5em",
                    "margin-top": "1em",
                    "color": "#333",
                    "width": "8em",
                    "overflow": "hidden",
                    "text-overflow": "ellipsis",
                    "white-space": "nowrap"
                },
                ".glance-dialog-device > .body > .deviceOwner > .portrait": {
                    "position": "absolute",
                    "margin": ".6em",
                    "width": "3.5em",
                    "height": "3.5em",
                    "border": ".2em solid #fff",
                    "border-radius": "50%"
                },
                ".glance-dialog-device > .body > .deviceOwner > .subtitle": {
                    "margin-left": "8.2em",
                    "color": "#666",
                    "width": "12em",
                    "font-size": ".6em"
                },
                ".glance-dialog-device > .body  > .deviceOwner > .button": {
                    "cursor": "normal",
                    "padding": ".5em",
                    "border-radius": ".3em",
                    "cursor": "default"
                },
                ".glance-dialog-device > .body > .deviceOwner > .button-view": {
                    "font-size": ".6em",
                    "position": "absolute",
                    "top": "4em",
                    "left": "23em"
                },
                ".glance-dialog-device > .body > .deviceOwner > .button-send": {
                    "font-size": ".6em",
                    "position": "absolute",
                    "top": "4em",
                    "left": "30em"
                },
                ".glance-dialog-device > .body > .deviceOwner > .button-default": {
                    "color": "#333",
                    "border": "1px solid #e7e7e7"
                },
                ".glance-dialog-device > .body > .deviceOwner > .button-default:hover": {
                    "background": "#e7e7e7"
                },
                ".glance-dialog-device > .body > .deviceOwner > .button-default:active": {
                    "color": "#e7e7e7",
                    "background": "#666",
                    "border-color": "#666"
                },
                ".glance-dialog-device > .body > .deviceOwner > .button-default.disabled": {
                    "visibility": "hidden",
                    "color": "#dddddd",
                    "background": "#eeeeee"
                },
                ".glance-dialog-device > .body > .button": {
                    "text-align": "center",
                    "font-size": "0 1em 1em 1em",
                    "margin": "1em",
                    "padding": ".2em",
                    "border-radius": ".3em",
                    "cursor": "default"
                },
                ".glance-dialog-device > .body > .button-stop": {
                    "color": "black",
                    "background": "#ccc"
                },
                ".glance-dialog-device > .body > .button-close": {
                    "color": "black",
                    "background": "#ccc"
                },
                ".glance-dialog-device.routable-false > .body > .button-route": {
                    "display": "none"
                },
                ".glance-dialog-device.isme-true > .body > .button-route": {
                    "display": "none"
                },
                ".glance-dialog-device:not(.isroute-false) > .body > .button-route-true": {
                    "display": "none"
                },
                ".glance-dialog-device.isroute-false > .body > .button-route-false": {
                    "display": "none"
                },
                ".glance-dialog-device > .body > .button.button-default": {
                    "color": "white",
                    "background": "#cd0101"
                },
                ".glance-dialog-device > .body > .button.button-default.disabled": {
                    "visibility": "hidden",
                    "color": "#dddddd",
                    "background": "#eeeeee"
                }

            })
        }
    });
})(nx);
