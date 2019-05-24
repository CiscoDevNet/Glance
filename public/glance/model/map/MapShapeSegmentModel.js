(function(nx) {
    var EXPORT = nx.define("glance.editor.model.MapShapeSegmentModel", {
        properties: {
            action: null,
            values: function() {
                return new nx.List();
            }
        }
    });
})(nx);
