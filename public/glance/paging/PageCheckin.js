(function(nx) {
    var EXPORT = nx.define("glance.paging.PageCheckin", glance.paging.Page, {
        view: {
            cssclass: "glance-check-page-checkin",
            cssstyle: {
                display: nx.binding("service.whoami.category, service.selected", function(category, selected) {
                    return (category !== "expert" && category !== "guest" && selected) ? "block" : "none";
                })
            },
            content: [{
                type: "glance.paging.InfoPanel",
                properties: {
                    service: "{service}",
                    model: nx.binding("service.selected"),
                    nameReadonly: "{nameReadonly}"
                }
            }, {
                cssclass: "explain",
                content: "To check-in, I agree to tie my MAC address of this phone to the GLANCE application. Once checked-in, your location and movements inside the zone would be displayed on the big screen in real time until you check-out."
            }, {
                cssclass: ["button", "button-check", nx.binding("service.selected.name", function(name) {
                    return (name) ? "" : "disabled";
                })],
                content: "Check-in",
                events: {
                    "mousedown touchstart": function(sender, evt) {
                        if (!sender.hasClass("disabled")) {
                            if (evt.capture(sender, ["tap", "end"])) {
                                sender.toggleClass("active", true);
                            }
                        }
                    },
                    captureend: function(sender, evt) {
                        sender.toggleClass("active", false);
                    },
                    capturetap: function(sender, evt) {
                        this.fire("checkin");
                    }
                }
            }, {
                cssclass: "button button-cancel",
                content: "Cancel",
                events: {
                    "mousedown touchstart": function(sender, evt) {
                        evt.capture(sender, "tap");
                    },
                    capturetap: function(sender, evt) {
                        this.fire("cancel");
                    }
                }
            }]
        },
        properties: {
            nameReadonly: true
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-check-page-checkin": {
                    "z-index": "0"
                },
                ".glance-checking-view:not(.expert-selected) > .selected > *:not(.button-check)": {
                    "display": "none"
                },
                ".glance-check-page-checkin > *": {
                    "margin": "1rem"
                },
                ".glance-check-page-checkin > .explain": {
                    "font-size": ".55em"
                },
                ".glance-check-page-checkin > .button": {
                    "position": "relative",
                    "text-align": "center",
                    "border-color": "transparent",
                    "border-radius": ".2em",
                    "height": "2em",
                    "line-height": "2em"
                },
                ".glance-check-page-checkin > .button-check": {
                    "background": "#00bab0",
                    "color": "white"
                },
                ".glance-check-page-checkin > .button-check.active": {
                    "background": "rgba(0,186,176,.7)"
                },
                ".glance-check-page-checkin > .button-check.disabled": {
                    "background": "#ccc"
                },
                ".glance-check-page-checkin > .button-cancel": {
                    "color": "#666"
                },
            })
        }
    });
})(nx);
