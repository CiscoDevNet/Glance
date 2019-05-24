(function(nx) {
    var EXPORT = nx.define("glance.editor.model.SvgStrokeModel", {
        properties: {
            color: null,
            width: 1,
            linecap: null, // butt, round, square
            linejoin: null, // round, bevel
            linejoinmiterlimit: null,
            dasharray: null,
            dashoffset: null
        },
        statics: {
            getStrokeByElement: function(element) {
                var styles = window.getComputedStyle(element);
                var {
                    stroke,
                    opacity,
                    "stroke-width": width,
                    "stroke-linecap": linecap,
                    "stroke-linejoin": linejoin,
                    "stroke-linejoinmiterlimit": linejoinmiterlimit,
                    "stroke-dasharray": dasharray,
                    "stroke-dashoffset": dashoffset
                } = styles;
                if (stroke === "none") {
                    return null;
                }
                var rgba = nx.util.cssstyle.toRgbaArray(stroke, opacity);
                var color = new glance.editor.model.SvgColorModel();
                color.r(rgba[0]);
                color.g(rgba[1]);
                color.b(rgba[2]);
                color.a(rgba[3]);
                var stroke = new EXPORT();
                stroke.color(color);
                stroke.width(glance.common.Util.getSizeInPixel(width) || 0);
                stroke.linecap(linecap);
                stroke.linejoin(linejoin);
                stroke.linejoinmiterlimit(linejoinmiterlimit);
                stroke.dasharray(dasharray);
                stroke.dashoffset(dashoffset);
                return stroke;
            }
        }
    });
})(nx);
