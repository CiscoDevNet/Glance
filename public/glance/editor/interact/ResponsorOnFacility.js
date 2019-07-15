(function(nx) {
    var EXPORT = nx.define("glance.editor.interact.ResponsorOnFacility", glance.editor.interact.Responsor, {
        methods: {
            tap: function(sender, evt) {
                var editor = this.owner();
                var editorBound = editor.getBound();
                var editorModel = editor.model();
                var model = sender.model();
                editorModel.active(model);
            },
            drag: function(sender, evt) {
                var scale = this.owner().model().scale();
                var vertex = sender.model().position();
                var delta = evt.capturedata.delta;
                vertex.x(vertex.x() + delta[0] / scale);
                vertex.y(vertex.y() + delta[1] / scale);
            }
        },
        statics: {
            RESPONSE_MODES: ["idle"],
            RESPONSE_KEY: "facility"
        }
    });
})(nx);
