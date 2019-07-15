(function(nx) {
    var EXPORT = nx.define("glance.editor.interact.ResponsorOnBoundaryBarriers", glance.editor.interact.ResponsorOfTemporaryShape, {
        properties: {
            shapeListKey: "barriers",
            shapeType: function() {
                return glance.editor.model.MapBarrierModel;
            }
        },
        statics: {
            RESPONSE_MODES: ["barriers"],
            RESPONSE_KEY: "boundary"
        }
    });
})(nx);
