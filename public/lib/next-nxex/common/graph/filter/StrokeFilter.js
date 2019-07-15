(function (nx, ui, toolkit, annotation, global) {
    var template = nxex.struct.Template.template, binding = nxex.struct.Binding.binding;
    /**
     * @class StrokeFilter
     * @namespace nxex.common.graph.filter
     */
    var EXPORT = nx.define("nxex.common.graph.filter.StrokeFilter", nxex.graph.filter.Filter, {
        struct: {
            properties: {
                x: "-200%",
                y: "-200%",
                width: "500%",
                height: "500%"
            },
            content: [{
                type: "nxex.graph.filter.FeColorMatrix",
                properties: {
                    "in": "SourceAlpha",
                    result: "colored",
                    type: "matrix",
                    values: binding("rgba", function (rgba) {
                        var r = rgba[0] / 255, g = rgba[1] / 255, b = rgba[2] / 255, a = rgba[3];
                        return "0 0 0 " + r + " 0 0 0 0 " + g + " 0 0 0 0 " + b + " 0 0 0 0 " + a + " 0";
                    })
                }
            }, {
                type: "nxex.graph.filter.FeMorphology",
                properties: {
                    "in": "colored",
                    result: "morph",
                    operator: "dilate",
                    radius: binding("radius")
                }
            }, {
                type: "nxex.graph.filter.FeBlend",
                properties: {
                    "in": "SourceGraphic",
                    in2: "morph",
                    mode: "normal"
                }
            }]
        },
        properties: {
            radius: {
                value: 1
            },
            rgba: {
                value: [255, 92, 0, 1]
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);

// <filter data-nx-type="59" id="outstroke" x="-200%" y="-200%" width="500%" height="500%">
// <feColorMatrix type="matrix" result="colored" in="SourceAlpha" values="0 0 0 1 0 0 0 0 .36 0 0 0 0 0 0 0 0 0 1 0"></feColorMatrix>
// <feMorphology result="morph" operator="dilate" in="colored" radius="3"></feMorphology>
// <feBlend in="SourceGraphic" in2="morph" mode="normal"></feBlend>
// </filter>
