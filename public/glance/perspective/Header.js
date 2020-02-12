(function(nx) {
    var EXPORT = nx.define("glance.perspective.Header", nx.ui.Element, {
        view: {
            cssclass: "glance-perspective-header",
            content: [{
                name: "brand",
                cssclass: "brand",
                content: [{
                    type: "nx.ui.tag.Image",
                    cssclass: "brand-glance",
                    attributes: {
                        src: "{model.uiConfig.logoUrl}"
                    }
                }, {
                    cssclass: "brand-glance-slogan",
                    content: "{model.uiConfig.title}"
                }]
            }, {
                cssclass: "info",
                content: [{
                    content: [{
                        content: "{now.hour}"
                    }, {
                        cssclass: "second",
                        content: ":"
                    }, {
                        content: "{now.minute}"
                    }]
                }, {
                    content: [
                        "{now.month}",
                        "&nbsp;",
                        "{now.day}"
                    ]
                }]
            }, {
                cssclass: "info",
                content: [{
                    content: "{model.total}"
                }, {
                    content: "DEVICES"
                }]
            }]
        },
        properties: {
            model: null,
            now: {
                async: true,
                value: function(async) {
                    return nx.timer(1000, function(again) {
                        var now = new Date();
                        async.set({
                            year: nx.date.format("yyyy", now),
                            month: nx.date.format("MMM", now).toUpperCase(),
                            day: nx.date.format("dd", now),
                            hour: nx.date.format("HH", now),
                            minute: nx.date.format("mm", now)
                        });
                        again();
                    });
                }
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-perspective-header": {
                    "position": "absolute",
                    "left": "0",
                    "right": "4em",
                    "top": "0",
                    "height": "4em",
                    // "background": "linear-gradient(to right, rgba(255,255,255,.1), rgba(255,255,255,.05) 70%, rgba(255,255,255,.1))",
                    "border-bottom": "1px solid #f1f1f1",
                    "color": "black",
                    "display": "flex"
                },
                ".glance-perspective-header > .brand": {
                    "flex-basis": "30em",
                    "flex-grow": "1",
                    "padding": ".8em 0 0 1em"
                },
                ".glance-perspective-header > .brand > *": {
                    "display": "inline-block"
                },
                ".glance-perspective-header > .brand > .brand-glance": {
                    "height": "2em",
                    "margin-right": "1em"
                },
                ".glance-perspective-header > .brand > .brand-glance-slogan": {
                    "vertical-align": "bottom",
                    "line-height": "2em",
                    "color": "#ececec",
                    "font-size": "1.2em",
                    "font-family": "Helvetica Neue",
                    "font-weight": "600",
                    "vertical-align": "text-bottom"
                },
                ".glance-perspective-header > .info": {
                    "position": "relative",
                    "flex-basis": "15em",
                    "flex-grow": "0",
                    "padding-top": "1em",
                    "text-align": "center",
                    "font-size": ".67em",
                    "font-family": "CiscoSans",
                    "font-weight": "100",
                    "color": "#ececec"
                },
                ".glance-perspective-header > .info + .info:before": {
                    "content": " ",
                    "position": "absolute",
                    "background": "#538592",
                    "left": "0",
                    "width": "1px",
                    "top": "1em",
                    "bottom": "1.2em"
                },
                ".glance-perspective-header > .info > :first-child": {
                    "font-size": "2.3em",
                    "line-height": "1.2em"
                },
                ".glance-perspective-header > .info > :first-child > *": {
                    "display": "inline"
                },
                ".glance-perspective-header > .info > :first-child > .second": {
                    "position": "relative",
                    "top": "-0.1em",
                    "animation": nx.util.csssheet.keyframes({
                        definition: {
                            "0%": {
                                "opacity": "1"
                            },
                            "49%": {
                                "opacity": "1"
                            },
                            "50%": {
                                "opacity": "0"
                            },
                            "100%": {
                                "opacity": "0"
                            }
                        },
                        "duration": "1s"
                    })
                },
                ".glance-perspective-header > .indicator": {
                    "background": "#333",
                    "flex-basis": "6rem",
                    "flex-grow": "0",
                    "line-height": "6rem",
                    "color": "white",
                    "text-align": "center",
                    "font-size": "3.5em"
                },
                ".glance-perspective-header > .indicator.none": {
                    "font-size": "2.5em",
                    "font-family": "FontAwesome"
                },
                ".glance-perspective-header > .indicator > suffix": {
                    "display": "inline",
                    "font-size": ".5em",
                    "color": "#ccc"
                }
            })
        }
    });
})(nx);
