(function(nx) {
    var EXPORT = nx.define("glance.perspective.search.SearchBox", nx.ui.Element, {
        view: {
            cssclass: "glance-search-box",
            content: [{
                name: "inputPanel",
                type: "glance.perspective.search.InputPanel",
                cssclass: "page",
                events: {
                    close: "{close}"
                }
            }]
        },
        properties: {
            word: nx.binding("inputPanel.word")
        },
        methods: {
            close: function() {
                this.inputPanel().clear();
                this.fire("close");
            },
            move: function(delta) {
                var position = this.position().slice();
                position[0] += delta[0];
                position[1] += delta[1];
                this.position(position);
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".glance-search-box": {
                    "background": "#ffffff",
                    "transition-property": "transform",
                    "transition-duration": ".3s",
                    "border-radius": ".2em",
                    "border": ".1em solid #00bab0"
                },
                ".glance-search-box > .page": {
                    "position": "relative",
                    "margin": "0 1em",
                    "height": "13em"
                },
               
            })
        }
    });
})(nx);
