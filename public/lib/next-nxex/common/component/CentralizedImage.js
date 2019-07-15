(function (nx, ui, toolkit, annotation, global) {
    var template = nxex.struct.Template.template,
        binding = nxex.struct.Binding.binding;
    var EXPORT = nx.define("nxex.common.component.CentralizedImage", nxex.struct.Element, {
        struct: {
            properties: {
                class: ["centralized-image"]
            },
            content: {
                name: "image",
                type: "nxex.struct.tag.Image",
                properties: {
                    src: binding("src")
                },
                events: {
                    load: function () {
                        var dom = this.image().dom();
                        var $dom = dom.$dom;
                        dom.setClass("size-height", $dom.height > $dom.width);
                        dom.setClass("size-width", $dom.width > $dom.height);
                    }
                }
            }
        },
        properties: {
            src: {}
        },
        statics: {
            CSS: toolkit.css({
                ".centralized-image": {
                    "position": "relative",
                    "overflow": "hidden"
                },
                ".centralized-image > img": {
                    "position": "absolute",
                    "left": "0px",
                    "top": "0px",
                    "right": "0px",
                    "bottom": "0px",
                    "margin": "auto",
                    "image-orientation": "from-image"
                },
                ".centralized-image > img.size-height": {
                    "width": "100%"
                },
                ".centralized-image > img.size-width": {
                    "height": "100%"
                }
            })
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
