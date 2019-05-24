(function(nx) {
    var EXPORT = nx.define("glance.editor.interact.ResponsorOnVertex", glance.editor.interact.Responsor, {
        methods: {
            tap: function(sender, evt) {
                // TODO
            },
            drag: function(sender, evt) {
                var scale = this.owner().model().scale();
                var vertex = sender.model();
                var delta = evt.capturedata.delta;
                vertex.x(vertex.x() + delta[0] / scale);
                vertex.y(vertex.y() + delta[1] / scale);
            }
        },
        statics: {
            RESPONSE_MODES: ["idle", "region", "boundary", "barrier", "wall"],
            RESPONSE_KEY: "vertex"
        }
    });
})(nx);
