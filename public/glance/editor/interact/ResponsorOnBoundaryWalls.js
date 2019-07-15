(function(nx) {
    var EXPORT = nx.define("glance.editor.interact.ResponsorOnBoundaryWalls", glance.editor.interact.ResponsorOfTemporaryShape, {
        properties: {
            shapeClose: false,
            shapeListKey: "walls",
            shapeType: function() {
                return glance.editor.model.MapWallModel;
            }
        },
        methods: {
            init: function() {
                this.inherited();
            }
        },
        statics: {
            RESPONSE_MODES: ["walls"],
            RESPONSE_KEY: "boundary"
        }
    });
})(nx);
