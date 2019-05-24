(function (nx, ui, toolkit, annotation, global) {

    var template = nxex.struct.Template.template,
        binding = nxex.struct.Binding.binding;
    var EXPORT = nx.define("nxex.struct.tag.Canvas", nxex.struct.Element, {
        view: {
            tag: "canvas"
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
