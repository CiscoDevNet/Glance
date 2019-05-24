(function(nx) {
    var EXPORT = nx.define("glance.editor.interact.ResponsorOnBoundaryRegions", glance.editor.interact.ResponsorOfTemporaryShape, {
        properties: {
            shapeListKey: "regions",
            shapeType: function() {
                return glance.editor.model.MapRegionModel;
            }
        },
        statics: {
            RESPONSE_MODES: ["regions"],
            RESPONSE_KEY: "boundary"
        }
    });
})(nx);
