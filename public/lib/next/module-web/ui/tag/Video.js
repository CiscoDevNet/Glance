(function (nx) {

    var EXPORT = nx.define("nx.ui.tag.Video", nx.ui.Element, {
        methods: {
            init: function () {
                this.inherited("video");
            },
	    play: function(){
		this.dom().play();
	    },
	    pause: function(){
		this.dom().pause();
	    }
	}
    });
})(nx);
