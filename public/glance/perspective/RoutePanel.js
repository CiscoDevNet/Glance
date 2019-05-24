(function(nx) {
    var EXPORT = nx.define("glance.perspective.RoutePanel", nx.ui.Element, {
        view: {
            cssclass: "glance-route-panel",
            content: [{
                cssclass: "header",
                content: [{
                    cssclass: "title",
                    content: ["Go to ", "{model.title}"]
                }, {
                    type: "nx.lib.component.SvgIcon",
                    cssclass: "close",
                    properties: {
                        src: "glance/icon/icons.svg",
                        key: "close",
                        fill: "#999999"
                    },
                    capture: {
                        tap: function() {
                            this.fire("close");
                        }
                    }
                }]
            }, {
                repeat: "{model.routeDetails}",
                cssclass: ["route", nx.binding("scope.context.model.selection, scope.index", function(selection, index) {
                    return selection === index && "active";
                })],
                content: [{
                    cssclass: "header",
                    content: [{
                        content: "{scope.model.title}"
                    }, {
                        content: "{scope.model.time}"
                    }]
                }, {
                    cssclass: "segments",
                    content: [{
                        repeat: "{scope.model.segments}",
                        cssclass: "segment",
                        content: [{
                            content: "{scope.model.title}"
                        }, {
                            content: "{scope.model.time}"
                        }]
                    }, {
                        cssclass: "segment",
                        content: [{
                            content: ["Arrive at ", "{scope.context.model.title}"]
                        }, {
                            content: "{scope.model.time}"
                        }]
                    }]
                }],
                capture: {
                    tap: function() {
                        this.scope().context().model().selection(this.scope().index());
                    }
                }
            }]
        },
        properties: {
            model: null
        },
        statics: {
            getTimeByDistance: function(distance) {
                return Math.floor((distance || 0) / 80) + "min";
            },
            CSS: nx.util.csssheet.create({
                ".glance-route-panel": {
                    "background": "rgba(0,0,0,.5)"
                },
                ".glance-route-panel > .header": {
                    "position": "relative",
                    "line-height": "2em",
                    "font-size": "2em",
                    "margin-top": ".3em",
                    "color": "#30e2d5",
                    "background": "rgba(255,255,255,.2)"
                },
                ".glance-route-panel > .header > .title": {
                    "margin-left": ".5em"
                },
                ".glance-route-panel > .header:before": {
                    "content": " ",
                    "display": "block",
                    "height": "0.2em",
                    "background": "linear-gradient(to right, #67bd71, #16aec6)"
                },
                ".glance-route-panel > .header > .close": {
                    "position": "absolute",
                    "top": "0.2em",
                    "right": "0",
                    "width": "2em",
                    "height": "2em"
                },
                ".glance-route-panel > .route": {
                    "font-size": "0.7em",
                    "padding-bottom": "0.5em"
                },
                ".glance-route-panel > .route > .header": {
                    "cursor": "pointer",
                    "font-size": "1.5em",
                    "position": "relative",
                    "display": "flex",
                    "justify-content": "space-between"
                },
                ".glance-route-panel > .route > .header > :first-child": {
                    "margin-left": "1em",
                    "line-height": "2.5em"
                },
                ".glance-route-panel > .route > .header > :last-child": {
                    "margin-right": "0.5em",
                    "line-height": "2.5em"
                },
                ".glance-route-panel > .route > .header:before": {
                    "content": " ",
                    "position": "absolute",
                    "left": "0em",
                    "width": "0.3em",
                    "top": "0em",
                    "bottom": "0em",
                    "background": "#cccccc"
                },
                ".glance-route-panel > .route.active > .header:before": {
                    "background": "#30e2d5"
                },
                ".glance-route-panel > .route > .segments": {
                    "padding-bottom": "0.5em",
                    "margin": "-1.5em 0 0 1.5em"
                },
                ".glance-route-panel > .route:not(.active) > .segments": {
                    "display": "none"
                },
                ".glance-route-panel > .route > .segments > .segment": {
                    "position": "relative",
                    "display": "flex",
                    "justify-content": "space-between",
                    "height": "3em"
                },
                ".glance-route-panel > .route > .segments > .segment:before": {
                    "content": " ",
                    "display": "block",
                    "position": "absolute",
                    "left": "0em",
                    "top": "1.1em",
                    "width": ".001em",
                    "height": ".001em",
                    "background": "#f7931e",
                    "border": "0.4em solid #f7931e",
                    "border-radius": "50%"
                },
                ".glance-route-panel > .route > .segments > .segment:not(:last-child):after": {
                    "content": " ",
                    "display": "block",
                    "position": "absolute",
                    "left": "0.3em",
                    "top": "1.45em",
                    "width": "0.1em",
                    "height": "3em",
                    "background": "#f7931e",
                },
                ".glance-route-panel > .route > .segments > .segment > :first-child": {
                    "line-height": "3.3em",
                    "margin-left": "1.2em"
                },
                ".glance-route-panel > .route > .segments > .segment > :last-child": {
                    "line-height": "3.1em",
                    "margin-right": "0.5em"
                },
                ".glance-route-panel > .qrcode-panel": {
                    "position": "relative",
                    "margin": "auto",
                    "padding": "2em 0",
                    "width": "100%",
                    "text-align": "center"
                },
                ".glance-route-panel > .qrcode-panel > .qrcode": {
                    "display": "block",
                    "width": "70%",
                    "margin": "0 auto 1em"
                }
            })
        }
    });
})(nx);
