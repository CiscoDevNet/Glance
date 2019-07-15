(function(nx) {
    var EXPORT = nx.define("glance.editor.model.SvgColorModel", {
        properties: {
            r: 0,
            g: 0,
            b: 0,
            a: 0,
            def: nx.binding("r,g,b,a", function(r, g, b, a) {
                return "rgba(" + [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255), a].join(",") + ")";
            })
        },
        statics: {
            getFillColorByElement: function(element) {
                var styles = window.getComputedStyle(element);
                var fill = styles.fill;
                var opacity = styles.opacity;
                if (fill === "none") {
                    return null;
                }
                var rgba = nx.util.cssstyle.toRgbaArray(fill, opacity);
                var color = new EXPORT();
                color.r(rgba[0] / 255);
                color.g(rgba[1] / 255);
                color.b(rgba[2] / 255);
                color.a(rgba[3]);
                return color;
            }
        }
    });
})(nx);
