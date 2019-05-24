(function (nx, ui, toolkit, annotation, global) {

    var template = nxex.struct.Template.template,
        binding = nxex.struct.Binding.binding;
    var EXPORT = nx.define("nxex.struct.tag.Audio", nxex.struct.Element, {
        view: {
            tag: "audio"
        },
        struct: {
            content: template({
                source: "sources",
                template: {
                    type: "nxex.struct.tag.Source",
                    properties: {
                        src: binding("template.model.src"),
                        type: binding("template.model.type")
                    }
                }
            })
        },
        properties: {
            sources: {}
        },
        methods: {
            play: function () {
                this.dom().$dom.play();
            },
            pause: function () {
                this.dom().$dom.pause();
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
