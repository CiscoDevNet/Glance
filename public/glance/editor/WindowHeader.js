(function(nx) {
    var EXPORT = nx.define("glance.editor.WindowHeader", nx.ui.Element, {
        view: {
            cssclass: [
                "glance-editor-header",
                nx.binding("page", function(page) {
                    return "toggle-active-" + page;
                })
            ],
            content: [{
                cssclass: "nav",
                content: [{
                    cssclass: "toggle-map",
                    content: "MAP"
                }, {
                    cssclass: "toggle-function",
                    content: "FUNCTION"
                }, {
                    cssclass: "toggle-publish",
                    content: "PUBLISH"
                }],
                events: {
                    click: function(sender, evt) {
                        this.page(evt.target.innerHTML.toLowerCase());
                    }
                }
            }, {
                cssclass: "brand",
                content: {
                    type: "glance.common.BrandA",
                    properties: {
                        color: "white"
                    }
                },
                events: {
                    click: function(sender, evt) {
                        this.fire("close");
                    }
                }
            }, {
                name: "titleLabel",
                type: "nx.ui.tag.Input",
                cssclass: "title",
                attributes: {
                    value: "{title}"
                },
                events: {
                    blur: function() {
                        this.title(this.titleLabel().dom().value);
                    },
                    keypress: function(sender, evt) {
                        if (evt.keyCode === nx.env.KEY_MAP.ENTER) {
                            this.titleLabel().blur();
                        }
                    },
                    keyup: function(sender, evt) {
                        if (evt.keyCode === nx.env.KEY_MAP.ESCAPE) {
                            this.titleLabel().dom().value = this.title();
                            this.titleLabel().blur();
                        }
                    }
                }
            }]
        },
        properties: {
            page: "map",
            title: "Untitled"
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-editor-header": {
                    "position": "absolute",
                    "left": "0px",
                    "right": "0px",
                    "top": "0px",
                    "height": "2em",
                    "line-height": "2em",
                    "background": "#00224e",
                    "overflow": "hidden"
                },
                ".glance-editor-header > .nav": {
                    "float": "right"
                },
                ".glance-editor-header > .nav > nx-element": {
                    "display": "inline-block",
                    "vertical-align": "top",
                    "font-size": ".7em",
                    "margin": "0 1em 0 0",
                    "cursor": "pointer"
                },
                ".glance-editor-header > .nav > nx-element.active": {
                    "color": "#30E2D5",
                    "cursor": "default"
                },
                ".glance-editor-header > .brand": {
                    "display": "inline-block",
                    "margin-right": ".5em",
                    "padding": ".5em",
                    "vertical-align": "top",
                    "background": "#00bab0"
                },
                ".glance-editor-header > .brand > img": {
                    "display": "inline-block",
                    "vertical-align": "top",
                    "height": "1em"
                },
                ".glance-editor-header > .title": {
                    "vertical-align": "middle",
                    "display": "inline-block",
                    "outline": "none",
                    "border": "0px",
                    "background-color": "transparent",
                    "color": "inherit"
                }
            })
        }
    });
})(nx);
