(function(nx) {
    var EXPORT = nx.define("glance.paging.PageCheckout", glance.paging.Page, {
        events: ["checkout"],
        view: {
            cssclass: "glance-check-page-checkout",
            cssstyle: {
                display: nx.binding("service.whoami.category", function(category) {
                    return (category === "expert" || category === "guest") ? "block" : "none";
                })
            },
            content: [{
                type: "glance.paging.InfoPanel",
                properties: {
                    service: "{service}",
                    model: nx.binding("service.whoami"),
                    nameReadonly: true
                }
            }, {
                cssclass: "success",
                content: [{
                    content: "Successfully Checked-in"
                }, {
                    content: "You are now on the glance big screen"
                }]
            }, {
                cssclass: "explain",
                content: "Once the page is closed, you could re-visit this page by scan the QR code again."
            }, {
                cssclass: "button button-cancel",
                content: "Check-out",
                capture: {
                    start: function(sender) {
                        sender.toggleClass("active", true);
                    },
                    end: function(sender, evt) {
                        sender.toggleClass("active", false);
                    },
                    tap: function(sender, evt) {
                        this.fire("checkout");
                    }
                }
            }, {
                cssclass: ["button button-cancel", nx.binding("closeText", function(closeText) {
                    return closeText ? "" : "hidden";
                })],
                content: "{closeText}",
                capture: {
                    start: function(sender) {
                        sender.toggleClass("active", true);
                    },
                    end: function(sender, evt) {
                        sender.toggleClass("active", false);
                    },
                    tap: function(sender, evt) {
                        this.fire("close");
                    }
                }
            }]
        },
        properties: {
            closeText: ""
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-check-page-checkout > *": {
                    "margin": "1rem"
                },
                ".glance-check-page-checkout > form ~ nx-element": {
                    "text-align": "center"
                },
                ".glance-check-page-checkout > .success": {
                    "text-align": "center",
                    "padding-bottom": "1em",
                    "border-bottom": "1px solid #666"
                },
                ".glance-check-page-checkout > .success:before": {
                    "content": "\\f05d",
                    "display": "block",
                    "margin": "auto",
                    "font-family": "FontAwesome",
                    "color": "#39b54a",
                    "font-size": "2.5em",
                    "width": "2em",
                    "border-radius": "50%",
                    "clear": "right"
                },
                ".glance-check-page-checkout > .success > nx-element:last-child": {
                    "font-size": ".9em",
                    "font-weight": "100"
                },
                ".glance-check-page-checkout > .explain": {
                    "text-align": "left",
                    "font-size": ".55em",
                    "padding": ".7em"
                },
                ".glance-check-page-checkout > .explain span": {
                    "color": "#f49131"
                },
                ".glance-check-page-checkout > .button": {
                    "text-align": "center",
                    "border-color": "transparent",
                    "border-radius": ".2em",
                    "height": "2em",
                    "line-height": "2em"
                },
                ".glance-check-page-checkout > .button-cancel": {
                    "background": "#00bab0",
                    "color": "white"
                },
                ".glance-check-page-checkout > .button-cancel.active": {
                    "background": "rgba(0,186,176,.7)"
                },
                ".glance-check-page-checkout > .button-cancel.disabled": {
                    "background": "#cccccc"
                },
                ".glance-check-page-checkout > .button-cancel.hidden": {
                    "display": "none"
                }
            })
        }
    });
})(nx);
