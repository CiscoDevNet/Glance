(function(nx) {
    var EXPORT = nx.define("glance.perspective.ControlPanelBubble", nx.ui.Element, {
        view: {
            cssclass: "glance-control-panel-bubble",
            content: [{
                cssclass: "title",
                content: "Display on map"
            }, {
                repeat: "{options}",
                cssclass: ["item", nx.binding("scope.model.key", function(key) {
                    return "active-{scope.context.model.show" + (key.charAt(0).toUpperCase() + key.substring(1)) + "}";
                })],
                content: {
                    cssclass: "name",
                    content: "{scope.model.text}"
                },
                capture: {
                    tap: function(sender, evt) {
                        var key = nx.path(sender, "scope.model.key");
                        var path = "scope.context.model.show" + (key.charAt(0).toUpperCase() + key.substring(1));
                        var value = nx.path(sender, path);
                        nx.path(sender, path, !value);
                    }
                }
            }]
        },
        properties: {
            model: null,
            options: null
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-control-panel-bubble": {
                    "font-size": ".5em",
                    "line-height": "2em",
                    "padding": ".3em",
                    "color": "#00bab0",
                    "text-align": "left"
                },
                ".glance-control-panel-bubble > .title": {
                    "margin": ".3em",
                    "font-weight": "bold"
                },
                ".glance-control-panel-bubble > .item": {
                    "margin": ".3em",
                    "padding": "0 .3em",
                    "border": ".05em solid #00bab0",
                    "border-radius": ".3em",
                    "background": "#ffffff"
                },
                ".glance-control-panel-bubble > .item > .name": {
                    "display": "inline-block",
                    "vertical-align": "top",
                    "margin-top": ".13em"
                },
                ".glance-control-panel-bubble > .item:hover": {
                    "background": "#00bab0",
                    "color": "white"
                },
                ".glance-control-panel-bubble > .item.active-true": {
                    "background": "#00bab0",
                    "color": "white"
                },
                ".glance-control-panel-bubble > .item:before": {
                    "content": "\\f10c",
                    "color": "#00bab0",
                    "font-family": "FontAwesome",
                    "font-size": "1.5em",
                    "margin-right": ".2em",
                    "vertical-align": "top"
                },
                ".glance-control-panel-bubble > .item:hover:before": {
                    "color": "#ffffff"
                },
                ".glance-control-panel-bubble > .item.active-true:before": {
                    "content": "\\f05d",
                    "color": "#ffffff"
                }
            })
        }
    });
})(nx);
