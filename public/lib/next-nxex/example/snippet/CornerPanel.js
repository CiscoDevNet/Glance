var template = nxex.struct.Template.template,
    binding = nxex.struct.Binding.binding;
var Cornerpanel = nx.define(nxex.struct.Element, {
    struct: {
        properties: {
            class: "glance-panel"
        },
        content: [{
            properties: {
                class: "outer-box"
            }
        }, {
            properties: {
                class: "corner corner-nw"
            }
        }, {
            properties: {
                class: "corner corner-ne"
            }
        }, {
            properties: {
                class: "corner corner-sw"
            }
        }, {
            properties: {
                class: "corner corner-se"
            }
        }]
    },
    statics: {
        CSS: toolkit.css({
            ".glance-panel": {
                "position": "relative",
                "min-width": "31px",
                "min-height": "31px"
            },
            ".glance-panel > *": {
                "position": "relative",
                "z-index": "1"
            },
            ".glance-panel > .corner": {
                "z-index": "2",
                "position": "absolute",
                "width": "5px",
                "height": "5px"
            },
            ".glance-panel > .corner:before": {
                "content": " ",
                "background": "#b3b3b3",
                "display": "block",
                "position": "absolute",
                "width": "15px",
                "height": "5px"
            },
            ".glance-panel > .corner:after": {
                "content": " ",
                "background": "#b3b3b3",
                "display": "block",
                "position": "absolute",
                "width": "5px",
                "height": "15px"
            },
            ".glance-panel > .corner-nw, .glance-panel > .corner-ne, .glance-panel > .corner-nw:after, .glance-panel > .corner-ne:after": {
                "top": "0px"
            },
            ".glance-panel > .corner-sw, .glance-panel > .corner-se, .glance-panel > .corner-sw:after, .glance-panel > .corner-se:after": {
                "bottom": "0px"
            },
            ".glance-panel > .corner-nw, .glance-panel > .corner-sw, .glance-panel > .corner-nw:before, .glance-panel > .corner-sw:before": {
                "left": "0px"
            },
            ".glance-panel > .corner-ne, .glance-panel > .corner-se, .glance-panel > .corner-ne:before, .glance-panel > .corner-se:before": {
                "right": "0px"
            },
            ".glance-panel > .outer-box": {
                "z-index": "0",
                "border-style": "solid",
                "border-width": "1px",
                "border-color": "#b3b3b3",
                "position": "absolute",
                "left": "2px",
                "top": "2px",
                "right": "2px",
                "bottom": "2px"
            }
        })
    }
});
