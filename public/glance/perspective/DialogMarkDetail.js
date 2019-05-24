(function(nx) {
    var EXPORT = nx.define("glance.perspective.DialogMarkDetail", glance.common.Dialog, {
        view: {
            cssclass: "glance-dialog-mark routable-{routable} isme-{model.isme} isroute-{model.isroute}",
            extend: {
                body: {
                    content: [{
                        cssclass: "title",
                        content: "{model.name}"
                    }, {
                        cssclass: "content",
                        content: "{model.description}"
                    }, {
                        cssclass: "button button-default button-route button-route-true",
                        content: "Navigate",
                        capture: {
                            tap: function(sender) {
                                this.fire("navigate", true);
                            }
                        }
                    }, {
                        cssclass: "button button-route button-route-false",
                        content: "Stop Navigating",
                        capture: {
                            tap: function() {
                                this.fire("navigate", false);
                            }
                        }
                    }, {
                        cssclass: "button",
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
                ".glance-dialog-mark > .body > .title": {
                    "padding": ".5em",
                    "font-size": "2em",
                    "color": "#333",
                    "background": "#f7f7f7",
                    "border-bottom": "1px solid #e7e7e7"
                },
                ".glance-dialog-mark > .body > .content": {
                    "padding": "1em"
                },
                ".glance-dialog-mark > .body > .content > bullet": {
                    "color": "#cd0101",
                    "font-weight": "bold"
                },
                ".glance-dialog-mark > .body > .button": {
                    "text-align": "center",
                    "cursor": "normal",
                    "font-size": "1.2em",
                    "margin": "1em",
                    "padding": ".2em",
                    "color": "black",
                    "background": "#cccccc",
                    "border-radius": ".3em",
                    "cursor": "default"
                },
                ".glance-dialog-mark.routable-false > .body > .button-route": {
                    "display": "none"
                },
                ".glance-dialog-mark.isme-true > .body > .button-route": {
                    "display": "none"
                },
                ".glance-dialog-mark:not(.isroute-false) > .body > .button-route-true": {
                    "display": "none"
                },
                ".glance-dialog-mark.isroute-false > .body > .button-route-false": {
                    "display": "none"
                },
                ".glance-dialog-mark > .body > .button.button-default": {
                    "color": "white",
                    "background": "#cd0101"
                },
                ".glance-dialog-mark > .body > .button.button-default.disabled": {
                    "visibility": "hidden",
                    "color": "#dddddd",
                    "background": "#eeeeee"
                }
            })
        }
    });
})(nx);
