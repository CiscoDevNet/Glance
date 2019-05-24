(function(nx) {
    var EXPORT = nx.define("glance.editor.interact.ResponsorOnWall", glance.editor.interact.Responsor, {
        methods: {
            tap: function(sender, evt) {
                this.owner().model().active(sender.model());
                this.owner().model().mode("wall");
            }
        },
        statics: {
            RESPONSE_MODES: ["idle", "wall", "walls"],
            RESPONSE_KEY: "wall"
        }
    });
})(nx);
