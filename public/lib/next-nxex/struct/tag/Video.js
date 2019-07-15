(function (nx, ui, toolkit, annotation, global) {

    var template = nxex.struct.Template.template,
        binding = nxex.struct.Binding.binding;
    var EXPORT = nx.define("nxex.struct.tag.Video", nxex.struct.Element, {
        view: {
            tag: "video"
        },
	methods: {
	    play: function(){
		this.dom().$dom.play();
	    },
	    pause: function(){
		this.dom().$dom.pause();
	    }
	}
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
