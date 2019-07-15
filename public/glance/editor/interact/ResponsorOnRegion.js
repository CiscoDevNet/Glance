(function(nx) {
    var EXPORT = nx.define("glance.editor.interact.ResponsorOnRegion", glance.editor.interact.Responsor, {
        methods: {
            tap: function(sender, evt) {
		this.owner().model().active(sender.model());
		this.owner().model().mode("region");
            }
        },
        statics: {
            RESPONSE_MODES: ["idle", "region", "regions"],
            RESPONSE_KEY: "region"
        }
    });
})(nx);
