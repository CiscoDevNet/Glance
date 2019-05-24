(function(nx) {
    var EXPORT = nx.define("glance.editor.interact.ResponsorOnEdge", glance.editor.interact.Responsor, {
        methods: {
            tap: function(sender, evt) {
                // TODO
            },
            drag: function(sender, evt) {
                var scale = this.owner().model().scale();
                var delta = evt.capturedata.delta;
                nx.each(nx.path(sender, "model.vertices"), function(vertex) {
                    vertex.x(vertex.x() + delta[0] / scale);
                    vertex.y(vertex.y() + delta[1] / scale);
                });
            }
        },
        statics: {
            RESPONSE_MODES: ["idle", "boundary", "wall", "region", "barrier"],
            RESPONSE_KEY: "edge"
        }
    });
})(nx);
