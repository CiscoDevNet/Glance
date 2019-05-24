(function (nx, ui, toolkit, annotation, global) {
    var template = nxex.struct.Template.template, binding = nxex.struct.Binding.binding;
    var EXPORT = nx.define("nxex.graph.shape.PathGroup", nxex.graph.Node, {
        struct: {
            content: template({
                source: "data",
                template: {
                    type: "nxex.graph.shape.Path",
                    properties: {
                        d: binding("template.model.d"),
                        fill: binding("template.model.fill"),
                        stroke: binding("template.model.stroke")
                    }
                }
            })
        },
        properties: {
            data: {}
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
