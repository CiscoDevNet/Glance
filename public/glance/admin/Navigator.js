(function(nx) {

    var EXPORT = nx.define("glance.admin.Navigator", nx.ui.Element, {
        view: {
            cssclass: "glance-admin-navigator active-page-{activePage}",
            content: [{
                cssclass: "switcher",
                content: {
                    repeat: [
                        ["servers", "Map"],
                        ["devices", "Device"]
                    ],
                    cssclass: "button button-{scope.model.0} active-{active}",
                    properties: {
                        active: nx.binding("scope.context.activePage, scope.model.0", function(active, name) {
                            return active === name;
                        })
                    },
                    // content: "{scope.model.1}",
                    capture: {
                        tap: function() {
                            nx.path(this, "scope.context.activePage", nx.path(this, "scope.model.0"));
                        }
                    }
                }
            }, {
                cssclass: "page page-servers",
                content: {
                    type: "glance.admin.NavigatorPageServer",
                    properties: {
                        model: "{model}"
                    }
                }
            }, {
                cssclass: "page page-devices",
                content: {
                    type: "glance.admin.NavigatorPageDevice",
                    properties: {
                        model: "{model}"
                    }
                }
            }]
        },
        properties: {
            model: null,
            activePage: "servers"
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-admin-navigator > .switcher": {
                    "position": "relative",
                    "display": "flex",
                    "justify-content": "space-between",
                    "margin": ".5em"
                },
                ".glance-admin-navigator > .switcher > .button": {
                    "position": "relative",
                    "width": "0",
                    "height": "2.5em",
                    "line-height": "2.2em",
                    "overflow": "hidden",
                    "flex-grow": "1",
                    "color": "#b5c5d9",
                    "text-align": "center",
                    "cursor": "default"
                },
                ".glance-admin-navigator > .switcher > .button.active-true": {
                    "color": "#31e5dd"
                },
                ".glance-admin-navigator > .switcher > .button:not(.active-true):hover": {
                    "background": "rgba(0,0,0,.3)"
                },
                ".glance-admin-navigator > .switcher > .button:not(:first-child)": {
                    // "border-left": "1px solid #000"
                },
                ".glance-admin-navigator > .switcher > .button:before": {
                    "font-family": "FontAwesome",
                    "font-size": "1.2em"
                },
                ".glance-admin-navigator > .switcher > .button.button-servers:before": {
                    "content": "\\f0e8"
                },
                ".glance-admin-navigator > .switcher > .button.button-devices:before": {
                    "content": "\\f10b"
                },
                ".glance-admin-navigator > .switcher > .button:after": {
                    "content": " ",
                    "nx:absolute": "auto 0 0 0",
                    "height": "3px",
                    "background": "#a6b8d0"
                },
                ".glance-admin-navigator > .switcher > .button.active-true:after": {
                    "background": "#31e5dd"
                },
                ".glance-admin-navigator > .page": {
                    "position": "relative",
                    "padding": ".5em 0"
                },
                ".glance-admin-navigator:not(.active-page-devices) > .page-devices": {
                    "display": "none"
                },
                ".glance-admin-navigator:not(.active-page-servers) > .page-servers": {
                    "display": "none"
                }
            })
        }
    });

})(nx);
