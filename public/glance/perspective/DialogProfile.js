(function(nx) {
    var EXPORT = nx.define("glance.perspective.DialogProfile", glance.common.Dialog, {
        view: {
            cssclass: "glance-dialog-profile category-{model.category} routable-{routable} isme-{model.isme} isroute-{model.isroute}",
            extend: {
                body: {
                    content: [{
                        name: "header",
                        cssclass: "header"
                    }, {
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
                ".glance-dialog-profile > .body > .header": {
                    "width": "100%",
                    "color": "#333",
                    "height": "3em",
                    "border-bottom": "1px solid #e7e7e7"
                },
                ".glance-dialog-profile > .body > .title": {
                    "margin-left": "7em",
                    "margin-top": "1.5em",
                    "font-size": "1em",
                    "color": "#333"
                },
                ".glance-dialog-profile > .body > .portrait": {
                    "position": "absolute",
                    "left": "0",
                    "top": "2.5em",
                    "margin": "1em",
                    "width": "5em",
                    "height": "5em",
                    "border": ".2em solid #fff",
                    "border-radius": "50%"
                },
                ".glance-dialog-profile > .body > .subtitle": {
                    "margin-left": "9em",
                    "color": "#666",
                    "font-size": ".8em"
                },
                ".glance-dialog-profile > .body > .content": {
                    "padding": "1em",
                    "margin-left": "8em",
                    "font-size": ".8em"
                },
                ".glance-dialog-profile > .body > .content > bullet": {
                    "color": "#666",
                    "font-weight": "bold"
                },
                ".glance-dialog-profile > .body > .button": {
                    "text-align": "center",
                    "cursor": "normal",
                    "font-size": "1.2em",
                    "margin": "0em 1em 1em 1em",
                    "padding": ".2em",
                    "color": "black",
                    "background": "#cccccc",
                    "border-radius": ".3em",
                    "cursor": "default"
                },
                ".glance-dialog-profile.routable-false > .body > .button-route": {
                    "display": "none"
                },
                ".glance-dialog-profile.isme-true > .body > .button-route": {
                    "display": "none"
                },
                ".glance-dialog-profile:not(.isroute-false) > .body > .button-route-true": {
                    "display": "none"
                },
                ".glance-dialog-profile > .body > .button.button-default": {
                    "color": "white",
                    "background": "#00bab0"
                },
                ".glance-dialog-profile > .body > .button.button-default.disabled": {
                    "visibility": "hidden",
                    "color": "#dddddd",
                    "background": "#eeeeee"
                }
            })
        }
    });
})(nx);
