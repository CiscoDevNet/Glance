(function(nx) {
    var browser = nx.env.browser;
    var prefix = browser.cssPrefix;

    var EXPORT = nx.define("nx.util.cssstyle", {
        static: true,
        methods: {
            has: function(dom, key) {
                var css = dom.style.cssText;
                return css.indexOf(key) === 0 || css.indexOf(prefix + key) === 0;
            },
            get: function(dom, key) {
                return dom.style[EXPORT.camelize(key)];
            },
            getBound: function(dom) {
                var b = dom.getBoundingClientRect();
                return {
                    left: b.left,
                    top: b.top,
                    width: b.width,
                    height: b.height,
                    right: b.right,
                    bottom: b.bottom
                };
            },
            set: function(dom, key, value) {
                if (typeof key !== "string") {
                    var str = "";
                    nx.each(key, function(value, key) {
                        var kv = EXPORT.stylize(key, value);
                        str += kv.text;
                    });
                    str = dom.style.cssText + str;
                    dom.style.cssText = str;
                    return str;
                } else {
                    var kv = EXPORT.stylize(key, value);
                    dom.style.cssText += kv.text;
                    return kv.value;
                }
            },
            remove: function(dom, key) {
                return dom.style.removeProperty(EXPORT.camelize(key));
            },
            camelize: function(key) {
                var result;
                switch (key) {
                    case "float":
                        result = "cssFloat";
                        break;
                    default:
                        if (key.indexOf(prefix) === 0) {
                            key = browser.prefix + key.substring(prefix.length - 1);
                        }
                        result = nx.string.camelize(key);
                        break;
                }
                return result;
            },
            stylize: function(key, value) {
                key = nx.string.uncamelize(key);
                var prefixKey, prefixValue, text = "";
                // TODO more special rules
                // TODO add "px" for measurable keys
                // TODO pre-process for cross browser: prefix of -webkit-, -moz-, -o-, etc.
                switch (key) {
                    case "left":
                    case "right":
                    case "top":
                    case "bottom":
                    case "width":
                    case "height":
                        if (typeof value === "number") {
                            // default unit: pixel
                            value = value + "px";
                        }
                        break;
                    case "display":
                        if (typeof value !== "string") {
                            value = (!!value) ? "" : "none";
                        } else if (value === "flex") {
                            prefixValue = prefix + value;
                        }
                        break;
                    case "user-select": // user-select
                    case "transform-origin":
                    case "transform-style":
                    case "animation": // animation
                    case "animation-name":
                    case "animation-duration":
                    case "animation-delay":
                    case "animation-iteration-count":
                    case "animation-timing-function":
                    case "animation-fill-mode":
                    case "flex-direction": // flex box parent
                    case "flex-flow":
                    case "flex-wrap":
                    case "justify-content":
                    case "align-content":
                    case "align-items":
                    case "flex": // flex box child
                    case "order":
                    case "flex-grow":
                    case "flex-shrink":
                    case "flex-basis":
                    case "align-self":
                        prefixKey = prefix + key;
                        break;
                    case "content":
                        value = "\"" + value + "\"";
                        break;
                    case "background-image":
                        prefixValue = value.replace(/\S*gradient\(/gi, function(match) {
                            return prefix + match;
                        });
                        break;
                    case "transform": // transform
                        prefixKey = prefix + key;
                        if (nx.is(value, Array)) {
                            if (value.length == 3) {
                                value = EXPORT.toCssTransformMatrix(value);
                            } else if (value.length === 4) {
                                value = EXPORT.toCssTransformMatrix3d(value);
                            }
                        }
                }
                // create text
                if (prefixKey) {
                    text += prefixKey + ":" + (prefixValue || value) + ";";
                } else if (prefixValue) {
                    text += key + ":" + prefixValue + ";";
                }
                text += key + ":" + value + ";";
                return {
                    key: key,
                    prefixKey: prefixKey,
                    value: value,
                    prefixValue: prefixValue,
                    text: text
                };
            },
            toRgbaArray: (function() {
                // FIXME if ES6 not supported
                var COLORS = {
                    "aliceblue": [240, 248, 255, 1],
                    "antiquewhite": [250, 235, 215, 1],
                    "aqua": [0, 255, 255, 1],
                    "aquamarine": [127, 255, 212, 1],
                    "azure": [240, 255, 255, 1],
                    "beige": [245, 245, 220, 1],
                    "bisque": [255, 228, 196, 1],
                    "black": [0, 0, 0, 1],
                    "blanchedalmond": [255, 235, 205, 1],
                    "blue": [0, 0, 255, 1],
                    "blueviolet": [138, 43, 226, 1],
                    "brown": [165, 42, 42, 1],
                    "burlywood": [222, 184, 135, 1],
                    "cadetblue": [95, 158, 160, 1],
                    "chartreuse": [127, 255, 0, 1],
                    "chocolate": [210, 105, 30, 1],
                    "coral": [255, 127, 80, 1],
                    "cornflowerblue": [100, 149, 237, 1],
                    "cornsilk": [255, 248, 220, 1],
                    "crimson": [220, 20, 60, 1],
                    "cyan": [0, 255, 255, 1],
                    "darkblue": [0, 0, 139, 1],
                    "darkcyan": [0, 139, 139, 1],
                    "darkgoldenrod": [184, 134, 11, 1],
                    "darkgray": [169, 169, 169, 1],
                    "darkgrey": [169, 169, 169, 1],
                    "darkgreen": [0, 100, 0, 1],
                    "darkkhaki": [189, 183, 107, 1],
                    "darkmagenta": [139, 0, 139, 1],
                    "darkolivegreen": [85, 107, 47, 1],
                    "darkorange": [255, 140, 0, 1],
                    "darkorchid": [153, 50, 204, 1],
                    "darkred": [139, 0, 0, 1],
                    "darksalmon": [233, 150, 122, 1],
                    "darkseagreen": [143, 188, 143, 1],
                    "darkslateblue": [72, 61, 139, 1],
                    "darkslategray": [47, 79, 79, 1],
                    "darkslategrey": [47, 79, 79, 1],
                    "darkturquoise": [0, 206, 209, 1],
                    "darkviolet": [148, 0, 211, 1],
                    "deeppink": [255, 20, 147, 1],
                    "deepskyblue": [0, 191, 255, 1],
                    "dimgray": [105, 105, 105, 1],
                    "dimgrey": [105, 105, 105, 1],
                    "dodgerblue": [30, 144, 255, 1],
                    "firebrick": [178, 34, 34, 1],
                    "floralwhite": [255, 250, 240, 1],
                    "forestgreen": [34, 139, 34, 1],
                    "fuchsia": [255, 0, 255, 1],
                    "gainsboro": [220, 220, 220, 1],
                    "ghostwhite": [248, 248, 255, 1],
                    "gold": [255, 215, 0, 1],
                    "goldenrod": [218, 165, 32, 1],
                    "gray": [128, 128, 128, 1],
                    "grey": [128, 128, 128, 1],
                    "green": [0, 128, 0, 1],
                    "greenyellow": [173, 255, 47, 1],
                    "honeydew": [240, 255, 240, 1],
                    "hotpink": [255, 105, 180, 1],
                    "IndianRed": [205, 92, 92, 1],
                    "Indigo": [75, 0, 130, 1],
                    "ivory": [255, 255, 240, 1],
                    "khaki": [240, 230, 140, 1],
                    "lavender": [230, 230, 250, 1],
                    "lavenderblush": [255, 240, 245, 1],
                    "lawngreen": [124, 252, 0, 1],
                    "lemonchiffon": [255, 250, 205, 1],
                    "lightblue": [173, 216, 230, 1],
                    "lightcoral": [240, 128, 128, 1],
                    "lightcyan": [224, 255, 255, 1],
                    "lightgoldenrodyellow": [250, 250, 210, 1],
                    "lightgray": [211, 211, 211, 1],
                    "lightgrey": [211, 211, 211, 1],
                    "lightgreen": [144, 238, 144, 1],
                    "lightpink": [255, 182, 193, 1],
                    "lightsalmon": [255, 160, 122, 1],
                    "lightseagreen": [32, 178, 170, 1],
                    "lightskyblue": [135, 206, 250, 1],
                    "lightslategray": [119, 136, 153, 1],
                    "lightslategrey": [119, 136, 153, 1],
                    "lightsteelblue": [176, 196, 222, 1],
                    "lightyellow": [255, 255, 224, 1],
                    "lime": [0, 255, 0, 1],
                    "limegreen": [50, 205, 50, 1],
                    "linen": [250, 240, 230, 1],
                    "magenta": [255, 0, 255, 1],
                    "maroon": [128, 0, 0, 1],
                    "mediumaquamarine": [102, 205, 170, 1],
                    "mediumblue": [0, 0, 205, 1],
                    "mediumorchid": [186, 85, 211, 1],
                    "mediumpurple": [147, 112, 219, 1],
                    "mediumseagreen": [60, 179, 113, 1],
                    "mediumslateblue": [123, 104, 238, 1],
                    "mediumspringgreen": [0, 250, 154, 1],
                    "mediumturquoise": [72, 209, 204, 1],
                    "mediumvioletred": [199, 21, 133, 1],
                    "midnightblue": [25, 25, 112, 1],
                    "mintcream": [245, 255, 250, 1],
                    "mistyrose": [255, 228, 225, 1],
                    "moccasin": [255, 228, 181, 1],
                    "navajowhite": [255, 222, 173, 1],
                    "navy": [0, 0, 128, 1],
                    "oldlace": [253, 245, 230, 1],
                    "olive": [128, 128, 0, 1],
                    "olivedrab": [107, 142, 35, 1],
                    "orange": [255, 165, 0, 1],
                    "orangered": [255, 69, 0, 1],
                    "orchid": [218, 112, 214, 1],
                    "palegoldenrod": [238, 232, 170, 1],
                    "palegreen": [152, 251, 152, 1],
                    "paleturquoise": [175, 238, 238, 1],
                    "palevioletred": [219, 112, 147, 1],
                    "papayawhip": [255, 239, 213, 1],
                    "peachpuff": [255, 218, 185, 1],
                    "peru": [205, 133, 63, 1],
                    "pink": [255, 192, 203, 1],
                    "plum": [221, 160, 221, 1],
                    "powderblue": [176, 224, 230, 1],
                    "purple": [128, 0, 128, 1],
                    "rebeccapurple": [102, 51, 153, 1],
                    "red": [255, 0, 0, 1],
                    "rosybrown": [188, 143, 143, 1],
                    "royalblue": [65, 105, 225, 1],
                    "saddlebrown": [139, 69, 19, 1],
                    "salmon": [250, 128, 114, 1],
                    "sandybrown": [244, 164, 96, 1],
                    "seagreen": [46, 139, 87, 1],
                    "seashell": [255, 245, 238, 1],
                    "sienna": [160, 82, 45, 1],
                    "silver": [192, 192, 192, 1],
                    "skyblue": [135, 206, 235, 1],
                    "slateblue": [106, 90, 205, 1],
                    "slategray": [112, 128, 144, 1],
                    "slategrey": [112, 128, 144, 1],
                    "snow": [255, 250, 250, 1],
                    "springgreen": [0, 255, 127, 1],
                    "steelblue": [70, 130, 180, 1],
                    "tan": [210, 180, 140, 1],
                    "teal": [0, 128, 128, 1],
                    "thistle": [216, 191, 216, 1],
                    "tomato": [255, 99, 71, 1],
                    "turquoise": [64, 224, 208, 1],
                    "violet": [238, 130, 238, 1],
                    "wheat": [245, 222, 179, 1],
                    "white": [255, 255, 255, 1],
                    "whitesmoke": [245, 245, 245, 1],
                    "yellow": [255, 255, 0, 1],
                    "yellowgreen": [154, 205, 50, 1]
                };
                var rRGBA = /rgba\((\d+),\s?(\d+),\s?(\d+),\s?(\d+|\d*\.\d+)\)/;
                var rRGB = /rgb\((\d+),\s?(\d+),\s?(\d+)\)/;
                return function(color, opacity) {
                    if (opacity === undefined) {
                        opacity = 1;
                    }
                    var r, g, b, a;
                    r = g = b = 0, a = 1;
                    if (COLORS[color]) {
                        [r, g, b, a] = COLORS[color];
                    } else if (color.charAt(0) === "#") {
                        [r, g, b] = [Number.parseInt(color.substring(1, 3), 16), Number.parseInt(color.substring(3, 5), 16), Number.parseInt(color.substring(5, 7), 16)]
                    } else if (rRGBA.test(color)) {
                        color.replace(rRGBA, function(match, xr, xg, xb, xa) {
                            [r, g, b, a] = [xr * 1, xg * 1, xb * 1, xa * 1];
                        });
                    } else if (rRGB.test(color)) {
                        color.replace(rRGB, function(match, xr, xg, xb) {
                            [r, g, b] = [xr * 1, xg * 1, xb * 1];
                            a = 1;
                        });
                    }
                    return [r, g, b, a * opacity];
                };
            })(),
            toMatrixByTransform: (function() {
                var rMatrix = /matrix\(.*\)/;
                var rComma = /\s*,\s*|\s+/;
                return function(transform) {
                    var matrix, numbers;
                    if (!transform) {
                        return;
                    }
                    if (rMatrix.test(transform)) {
                        numbers = transform.substring(7, transform.length - 1).split(rComma).map(function(v) {
                            return v * 1;
                        });
                        matrix = [
                            [numbers[0], numbers[1], 0],
                            [numbers[2], numbers[3], 0],
                            [numbers[4], numbers[5], 1]
                        ];
                    }
                    return matrix || nx.geometry.Matrix.I;
                };
            })(),
            toCssTransformMatrix: function(matrix) {
                if (!matrix) {
                    return "none";
                }
                // FIXME too big digit
                var css = [matrix[0][0], matrix[0][1], matrix[1][0], matrix[1][1], matrix[2][0], matrix[2][1]].join(",").replace(/-?\d+e[+-]?\d+/g, "0");
                return "matrix(" + css + ")";
            },
            toCssTransformMatrix3d: function(matrix) {
                if (!matrix) {
                    return "none";
                }
                // FIXME too big digit
                var css = matrix.map(function(row) {
                    return row.join(",");
                }).join(",").replace(/-?\d+e[+-]?\d+/g, "0");
                return "matrix3d(" + css + ")";
            },
            toCssDisplayVisible: function(display) {
                return display ? "" : "none";
            }
        }
    });
})(nx);
