(function(nx) {

    var EXPORT = nx.define("glance.admin.Header", nx.ui.Element, {
        view: {
            cssclass: "glance-admin-header",
            content: [{
                cssclass: "brand",
                type: "glance.common.BrandGlance",
                properties: {
                    colorText: "#9aa9ba",
                    colorMark: "#30e2d5"
                }
            }, {
                cssclass: "button button-account-menu",
                content: [{
                    cssclass: "portrait"
                }, "John Smith"]
            }]
        },
        properties: {
            model: null
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-admin-header": {
                    "display": "flex",
                    "flex-direction": "column",
                    "justify-content": "space-between",
                    "line-height": "2.2em",
                    "text-align": "center"
                },
                ".glance-admin-header > .brand": {
                    "margin": ".7em",
                    "height": "3em"
                },
                ".glance-admin-header > .button": {
                    "cursor": "default",
                    "padding": ".5em",
                    "background": "#1c2c42"
                },
                ".glance-admin-header > .button:hover": {
                    // "background": "rgba(255,255,255,.2)"
                },
                ".glance-admin-header > .button-account-menu": {
                    "font-size": "1em"
                },
                ".glance-admin-header > .button-account-menu > .portrait": {
                    "display": "inline-block",
                    "nx:size": "2em",
                    "background": "#fafafa",
                    "border-radius": "50%",
                    "text-align": "center",
                    "vertical-align": "middle",
                    "overflow": "hidden",
                    "margin-right": ".5em"
                },
                ".glance-admin-header > .button-account-menu > .portrait:before": {
                    "font-family": "FontAwesome",
                    "content": "\\f007",
                    "line-height": "1.2em",
                    "font-size": "2.2em"
                }
            })
        }
    });

})(nx);
