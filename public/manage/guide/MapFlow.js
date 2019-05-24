(function (nx) {
    var EXPORT = nx.define("devme.manage.guide.MapFlow", nx.ui.Element, {
        view: {
            cssclass: "glance-guide map-flow",
            content: [{
                cssclass: "mask"
            }, {
                cssclass: "dialog",
                content: [{
                    cssclass: "title",
                    content: "Let's make the map alive"
                }, {
                    cssclass: "flow",
                    content: [{
                        content: [{
                            content: "1"
                        }, {
                            content: "Upload a image<br/>file of a map you<br/>want to track<br/>and display"
                        }]
                    }, {
                        content: [{
                            content: "2"
                        }, {
                            content: "Trace the map,<br/>Add legend,<br/>Define zones,<br/>Add information,<br/>Add actions"
                        }]
                    }, {
                        content: [{
                            content: "3"
                        }, {
                            content: "Select a layout,<br/>Pick widgets,<br/>Choose a theme,<br/>Publish the board"
                        }]
                    }]
                }, {
                    cssclass: "footer",
                    content: [{
                        cssclass: "button button-cancel",
                        content: "Cancel",
                        events: {
                            click: function () {
                                this.fire("close", {
                                    create: false
                                });
                            }
                        }
                    }, {
                        cssclass: "button button-submit",
                        content: "Upload a map",
                        events: {
                            click: function () {
                                this.fire("close", {
                                    create: true
                                });
                            }
                        }
                    }]
                }]
            }]
        },
        properties: {
            boards: {
                value: function () {
                    return null;
                    return [{
                        name: "Board 1"
                    }, {
                        name: "Board 2"
                    }]
                }
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-guide.map-flow": {
                    "position": "fixed",
                    "left": "0px",
                    "right": "0px",
                    "top": "0px",
                    "bottom": "0px"
                },
                ".glance-guide.map-flow > .mask": {
                    "position": "absolute",
                    "left": "0px",
                    "right": "0px",
                    "top": "0px",
                    "bottom": "0px",
                    "background": "rgba(0,0,0,.7)"
                },
                ".glance-guide.map-flow > .dialog": {
                    "position": "absolute",
                    "display": "block",
                    "left": "0px",
                    "right": "0px",
                    "top": "0px",
                    "bottom": "0px",
                    "margin": "auto",
                    "width": "40em",
                    "height": "20em",
                    "background": "white",
                    "border-radius": "1em",
                    "padding": "2em"
                },
                ".glance-guide.map-flow > .dialog > .title": {
                    "font-size": "2em",
                    "color": "#00bab0",
                    "padding-bottom": "1em"
                },
                ".glance-guide.map-flow > .dialog > .flow": {
                    "display": "flex"
                },
                ".glance-guide.map-flow > .dialog > .flow > *": {
                    "width": "33%",
                    "color": "black",
                    "font-size": "1.2em"
                },
                ".glance-guide.map-flow > .dialog > .flow > * > *:first-child": {
                    "font-size": "1.5em",
                    "text-align": "center",
                    "color": "white",
                    "background": "#00bab0",
                    "width": "1.6em",
                    "height": "1.6em",
                    "line-height": "1.6em",
                    "border-radius": "50%",
                    "margin-bottom": ".2em"
                },
                ".glance-guide.map-flow > .dialog > .footer": {
                    "position": "absolute",
                    "text-align": "right",
                    "left": "0px",
                    "right": "0px",
                    "bottom": "0px"
                },
                ".glance-guide.map-flow > .dialog > .footer > .button": {
                    "position": "relative",
                    "text-align": "center",
                    "font-size": "1.2em",
                    "display": "inline-block",
                    "margin": "1em 1em 1em 0",
                    "width": "10em",
                    "height": "2.5em",
                    "line-height": "2.5em",
                    "border-radius": ".5em",
                    "color": "#838383",
                    "background": "#cccccc"
                },
                ".glance-guide.map-flow > .dialog > .footer > .button-submit": {
                    "color": "#318e87",
                    "background": "#00bab0"
                },
                ".glance-guide.map-flow > .dialog > .footer > .button:after": {
                    "content": " ",
                    "position": "absolute",
                    "left": "0px",
                    "right": "0px",
                    "top": "0px",
                    "bottom": "0px",
                    "border-radius": "inherit"
                },
                ".glance-guide.map-flow > .dialog > .footer > .button:hover:after": {
                    "background": "rgba(255, 255, 255, .1)"
                },
                ".glance-guide.map-flow > .dialog > .footer > .button:active:after": {
                    "background": "rgba(0, 0, 0, .1)"
                }
            })
        }
    });
})(nx);
