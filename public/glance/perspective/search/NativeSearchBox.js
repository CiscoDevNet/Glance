(function(nx) {
	var EXPORT = nx.define("glance.perspective.search.NativeSearchBox", nx.ui.Element, {
		view: {
			cssclass: "native-search",
			content: [{
				name: "nativeInput",
				type: "nx.ui.tag.Input",
				cssclass: "native-input",
				attributes: {
					type: "text",
					value: "",
					placeholder: "Typing"
				},
				events: {
					input: function(evt) {
						this.word(evt._dom.value);
					}
				}
			}]
			
		},
		properties: {
			word: "",
		},
		methods:{
			close:function(){
				this.model() && this.model().search().visible(false);
			}
		},
		statics: {
			CSS: nx.util.csssheet.create({
				".native-search": {
					"background": "rgba(0,0,0,.2)",
					"transition-property": "transform",
					"transition-duration": ".3s",
                    "position":"fixed",
                    "bottom":"0",
                    "right":"4em",
                    "width":"90%",
                    "padding":"2% 1%"
				},
				".native-search > .native-input": {
					"height": "3em",
					"width":"100%",
					"border-radius": ".2em"
					
				}

			})
		}
	});
})(nx);