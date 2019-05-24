(function(nx) {
    var EXPORT = nx.define("glance.editor.interact.ResponsorOnBoundaryFacilities", glance.editor.interact.Responsor, {
        methods: {
            tap: function(sender, evt) {
                // TODO shapeClose
                var editor = this.owner();
                var editorBound = editor.getBound();
                var editorModel = editor.model();
                var matrix = nx.geometry.Matrix.inverse(editorModel.matrixActual());
                var list, temp, point;
                list = editorModel.facilities();
                temp = new glance.editor.model.MapFacilityModel();
                point = nx.geometry.Vector.transform([evt.capturedata.position[0] - editorBound.left, evt.capturedata.position[1] - editorBound.top], matrix);
                temp.position(new glance.editor.model.VertexModel(point[0], point[1]));
                temp.icon('data:image/svg+xml;utf8,<svg width="100px" height="100px"><text font-family="FontAwesome">&#f29c;</text></svg>');
                list.push(temp);
                editorModel.mode("idle");
                editorModel.active(temp);
            }
        },
        statics: {
            RESPONSE_MODES: ["facilities"],
            RESPONSE_KEY: "boundary"
        }
    });
})(nx);
