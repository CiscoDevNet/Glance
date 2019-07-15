(function (nx) {
    var EXPORT = nx.define("devme.check.PageCheckout", devme.check.Page, {
        events: ["checkout"],
        view: {
            cssclass: "glance-check-page-checkout",
            cssstyle: {
                display: nx.binding("global.app.service.expertChecked, global.app.service.expertSelected", function (checked, selected) {
                    return (checked && selected) ? "block" : "none";
                })
            },
            content: [{
                type: "devme.check.InfoPanel",
                properties: {
                    model: nx.binding("global.app.service.expertSelected")
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
                content: "<strong><span>IMPORTANT:</span> Please keep this page open and active to stay on the GLANCE big screen.</strong> Once the page is closed, you could re-visit this page by scan the QR code again."
            }, {
                cssclass: ["button button-cancel", nx.binding("global.app.service.expertSelected", function (selected) {
                    return selected ? "" : "disabled";
                })],
                content: "Check-out",
                events: {
                    "mousedown touchstart": function (sender, evt) {
                        if (!sender.hasClass("disabled")) {
                            if (evt.capture(sender, ["tap", "end"])) {
                                sender.toggleClass("active", true);
                            }
                        }
                    },
                    captureend: function (sender, evt) {
                        sender.toggleClass("active", false);
                    },
                    capturetap: function (sender, evt) {
                        this.fire("checkout");
                    }
                }
            }]
        },
        methods: {
            show: function (expert) {
                this.loading(true);
                this.expert(expert);
            }
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
                }
            })
        }
    });
})(nx);
