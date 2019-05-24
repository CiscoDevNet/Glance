(function(nx) {
    var EXPORT = nx.define("nx.lib.component.CentralizedImage", nx.ui.Element, {
        view: {
            attributes: {
                class: ["nx-centralized-image"]
            },
            content: {
                name: "image",
                type: "nx.ui.tag.Image",
                attributes: {
                    src: nx.binding("src")
                },
                events: {
                    load: function() {
                        var image = this.image();
                        var dom = image.dom();
                        if (this.clip()) {
                            image.toggleClass("size-height", dom.height > dom.width);
                            image.toggleClass("size-width", dom.width >= dom.height);
                        } else {
                            image.toggleClass("size-height", dom.height < dom.width);
                            image.toggleClass("size-width", dom.width <= dom.height);
                        }
                        this.fire("ready");
                    }
                }
            }
        },
        properties: {
            src: {},
            clip: true
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".nx-centralized-image": {
                    "position": "relative",
                    "overflow": "hidden"
                },
                ".nx-centralized-image > img": {
                    "position": "absolute",
                    "left": "0px",
                    "top": "0px",
                    "right": "0px",
                    "bottom": "0px",
                    "margin": "auto"
                },
                ".nx-centralized-image > img.size-height": {
                    "width": "100%"
                },
                ".nx-centralized-image > img.size-width": {
                    "height": "100%"
                }
            })
        }
    });
})(nx);
