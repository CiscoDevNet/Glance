(function(nx) {
    var EXPORT = nx.define("glance.editor.interact.ResponsorOnEditor", glance.editor.interact.Responsor, {
        methods: {
            tap: function(sender, evt) {
                this.owner().model().active(null);
                this.owner().model().mode("idle");
            },
            transform: function(sender, evt) {
                console.log("transform on editor");
            }
        },
        statics: {
            RESPONSE_MODES: ["idle", "wall", "region", "barrier", "facility"],
            RESPONSE_KEY: "editor"
        }
    });
})(nx);
