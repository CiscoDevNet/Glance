(function(nx) {
    var EXPORT = nx.define("glance.perspective.DialogPortrait", glance.common.Dialog, {
        view: {
            cssclass: "glance-dialog-portrait category-{model.category} routable-{routable} isme-{model.isme} isroute-{model.isroute}",
            extend: {
                body: {
                    content: [{
                        name: "title",
                        cssclass: "title"
                    }, {
                        name: "portrait",
                        type: "nx.lib.component.CentralizedImage",
                        cssclass: "portrait"
                    }, {
                        name: "subtitle",
                        cssclass: "subtitle"
                    }, {
                        name: "content",
                        cssclass: "content"
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
                ".glance-dialog-portrait > .body > .title": {
                    "padding": ".4em .5em .1em 3.5em",
                    "font-size": "2em",
                    "color": "black",
                    "background": "white",
                    "border-bottom": "1px solid #f1f1f1"
                },
                ".glance-dialog-portrait > .body > .portrait": {
                    "position": "absolute",
                    "left": "0",
                    "top": "0",
                    "margin": "1em",
                    "width": "4em",
                    "height": "4em",
                    "border": ".2em solid #fff",
                    "border-radius": "50%"
                },
                ".glance-dialog-portrait > .body > .subtitle": {
                    "padding": ".5em .5em .5em 7em",
                    "color": "#f1f1f1"
                },
                ".glance-dialog-portrait > .body > .content": {
                    "padding": "1em"
                },
                ".glance-dialog-portrait > .body > .content > bullet": {
                    "color": "#f1f1f1",
                    "font-weight": "bold"
                },
                ".glance-dialog-portrait > .body > .button": {
                    "text-align": "center",
                    "cursor": "normal",
                    "font-size": "1.2em",
                    "margin": "1em",
                    "padding": ".2em",
                    "color": "black",
                    "border": "1px solid #f1f1f1",
                    "border-radius": ".3em",
                    "cursor": "default"
                },
                ".glance-dialog-portrait.routable-false > .body > .button-route": {
                    "display": "none"
                },
                ".glance-dialog-portrait.isme-true > .body > .button-route": {
                    "display": "none"
                },
                ".glance-dialog-portrait:not(.isroute-false) > .body > .button-route-true": {
                    "display": "none"
                },
                ".glance-dialog-portrait.isroute-false > .body > .button-route-false": {
                    "display": "none"
                },
                ".glance-dialog-portrait > .body > .button.button-default": {
                    "color": "#333",
                    "background": "#f7f7f7",
                    "border": "1px solid #f7f7f7"
                },
                ".glance-dialog-portrait > .body > .button.button-default.disabled": {
                    "visibility": "hidden",
                    "color": "#f1f1f1",
                    "background": "white",
                    "border": "1px solid transparent"
                }
            })
        }
    });
})(nx);
