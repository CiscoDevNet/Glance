(function (nx) {
    var EXPORT = nx.define("devme.admin.ApplicationFrontPage", nx.ui.Element, {
        events: ["select"],
        view: {
            cssclass: "glance-admin-page",
            cssstyle: {
                display: nx.binding("global.app.service.page", function (page) {
                    return page ? "none" : "block";
                })
            },
            content: [{
                cssclass: "button",
                content: "CMX Setup",
                events: {
                    "mousedown touchstart": function (sender, evt) {
                        if (evt.capture(sender, ["tap", "end"])) {
                            sender.toggleClass("active", true);
                        }
                    },
                    captureend: function (sender, evt) {
                        sender.toggleClass("active", false);
                    },
                    capturetap: function (sender, evt) {
                        this.fire("select", "setup");
                    }
                }
            }, {
                cssclass: "button",
                content: "Register User",
                events: {
                    "mousedown touchstart": function (sender, evt) {
                        if (evt.capture(sender, ["tap", "end"])) {
                            sender.toggleClass("active", true);
                        }
                    },
                    captureend: function (sender, evt) {
                        sender.toggleClass("active", false);
                    },
                    capturetap: function (sender, evt) {
                        this.fire("select", "user-register");
                    }
                }
            }, {
                cssclass: "button",
                content: "Register Map",
                events: {
                    "mousedown touchstart": function (sender, evt) {
                        if (evt.capture(sender, ["tap", "end"])) {
                            sender.toggleClass("active", true);
                        }
                    },
                    captureend: function (sender, evt) {
                        sender.toggleClass("active", false);
                    },
                    capturetap: function (sender, evt) {
                        this.fire("select", "map-register");
                    }
                }
            }, {
                cssclass: "button",
                content: "Backup",
                events: {
                    "mousedown touchstart": function (sender, evt) {
                        if (evt.capture(sender, ["tap", "end"])) {
                            sender.toggleClass("active", true);
                        }
                    },
                    captureend: function (sender, evt) {
                        sender.toggleClass("active", false);
                    },
                    capturetap: function (sender, evt) {
                        this.fire("select", "backup");
                    }
                }
            }]
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-admin-page > *": {
                    "margin": "1em",
                    "font-weight": "300"
                },
                ".glance-admin-page > .button": {
                    "position": "relative",
                    "text-align": "center",
                    "border-color": "transparent",
                    "border-radius": ".2em",
                    "height": "2em",
                    "line-height": "2em",
                    "background": "#00bab0",
                    "color": "white",
                    "cursor": "default"
                },
                ".glance-admin-page > .button:hover": {
                    "background": "rgba(0,186,176,.5)"
                },
                ".glance-admin-page > .button.active": {
                    "background": "rgba(0,186,176,.7)"
                },
                ".glance-admin-page > .button.disabled": {
                    "background": "#ddd",
                    "color": "#eee"
                },
                ".glance-admin-page > .button.button-cancel": {
                    "cursor": "pointer",
                    "background": "none",
                    "color": "#666"
                },
                ".glance-admin-page > .button.button-cancel.active": {
                    "background": "none"
                }
            })
        }
    });
})(nx);
