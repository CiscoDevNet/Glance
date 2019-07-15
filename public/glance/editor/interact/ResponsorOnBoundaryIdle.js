(function(nx) {
    var EXPORT = nx.define("glance.editor.interact.ResponsorOnBoundaryIdle", glance.editor.interact.Responsor, {
        methods: {
            tap: function(sender, evt) {
                this.owner().model().active(nx.path(sender, "model"));
            }
        },
        statics: {
            RESPONSE_MODES: ["idle"],
            RESPONSE_KEY: "boundary"
        }
    });
})(nx);
