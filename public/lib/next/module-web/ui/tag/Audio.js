(function (nx) {

    var EXPORT = nx.define("nx.ui.tag.Audio", nx.ui.Element, {
        view: {
            content: {
                repeat: "sources",
                type: "nx.ui.tag.Source",
                attributes: {
                    src: nx.binding("scope.model.src"),
                    type: nx.binding("scope.model.type")
                }
            }
        },
        properties: {
            sources: {}
        },
        methods: {
            init: function () {
                this.inherited("audio");
            },
            play: function () {
                this.dom().play();
            },
            pause: function () {
                this.dom().pause();
            }
        }
    });
})(nx);
