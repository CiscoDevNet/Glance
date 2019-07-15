(function(nx) {
    var EXPORT = nx.define("glance.editor.interact.ResponsorOnBarrier", glance.editor.interact.Responsor, {
        methods: {
            tap: function(sender, evt) {
                this.owner().model().active(sender.model());
                this.owner().model().mode("barrier");
            }
        },
        statics: {
            RESPONSE_MODES: ["idle", "barrier", "barriers"],
            RESPONSE_KEY: "barrier"
        }
    });
})(nx);
