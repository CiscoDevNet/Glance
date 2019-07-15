(function(nx) {
    var EXPORT = nx.define("glance.editor.model.MapShapeModel", {
        properties: {
            segments: function() {
                return new nx.List();
            },
            color: null,
            csscolor: nx.binding("color", function(color) {
                if (color >= 0) {
                    var r, g, b, a;
                    r = color & 0xff000000;
                    g = color & 0x00ff0000;
                    b = color & 0x0000ff00;
                    a = String((color & 0x000000ff) / 255).substring(0, 4);
                    return ["rgba(", r, g, b, a, ")"].join("");
                }
            })
        }
    });
})(nx);
