(function (nx) {
    /**
     * @class Rectangle
     * @namespace nx.geometry
     */
    var EXPORT = nx.define("nx.geometry.Rectangle", {
        statics: {
            getBound: function (pos, size) {
                if (nx.is(pos, "Array")) {
                    pos = {
                        x: pos[0],
                        y: pos[1]
                    };
                }
                if (nx.is(size, "Array")) {
                    size = {
                        width: size[0],
                        height: size[1]
                    };
                }
                var x = size.width > 0 ? pos.x : pos.x - size.width;
                var y = size.height > 0 ? pos.y : pos.y - size.height;
                return {
                    x: x,
                    y: y,
                    left: x,
                    top: y,
                    width: Math.abs(size.width),
                    height: Math.abs(size.height)
                };
            },
            isInside: function (pos, bound) {
                return pos.x >= bound.x && pos.y >= bound.y && pos.x <= bound.x + bound.width && pos.y <= bound.y + bound.height;
            },
            calcCentralizeMatrix: function (matrix, stageSize, rect, padding, rectAccordMatrix) {
                if (!(stageSize.width > 0) ||
                    !(stageSize.height > 0) ||
                    !Math.abs(rect.width) ||
                    !Math.abs(rect.height)) {
                    return nx.geometry.Matrix.I;
                }
                var left = rect.left || 0;
                var top = rect.top || 0;
                var width = rect.width;
                var height = rect.height;
                if (!rectAccordMatrix) {
                    var xscale = matrix[0][0];
                    var yscale = matrix[1][1];
                    var xdelta = matrix[2][0];
                    var ydelta = matrix[2][1];
                    left = left * xscale + xdelta;
                    top = top * yscale + ydelta;
                    width *= xscale;
                    height *= yscale;
                }
                var swidth = stageSize.width - padding * 2;
                var sheight = stageSize.height - padding * 2;
                var s = Math.min(swidth / Math.abs(width), sheight / Math.abs(height));
                var dx = (padding + swidth / 2) - s * (left + width / 2);
                var dy = (padding + sheight / 2) - s * (top + height / 2);
                return [
                    [s, 0, 0],
                    [0, s, 0],
                    [dx, dy, 1]
                ];
            },
            /**
             * 
             */
            calcRectZoomMatrix: function (target, origin, accord) {
                if (!accord) {
                    // TODO 
                    var s = (!origin.width && !origin.height) ? 1 : Math.min(target.height / Math.abs(origin.height), target.width / Math.abs(origin.width));
                    var dx = (target.left + target.width / 2) - s * (origin.left + origin.width / 2);
                    var dy = (target.top + target.height / 2) - s * (origin.top + origin.height / 2);
                    return [
                        [s, 0, 0],
                        [0, s, 0],
                        [dx, dy, 1]
                    ];
                } else {
                    var s = (!origin.width && !origin.height) ? 1 : Math.min(target.height / Math.abs(origin.height), target.width / Math.abs(origin.width));
                    var dx = (target.width / 2) - s * (origin.left - target.left + origin.width / 2);
                    var dy = (target.height / 2) - s * (origin.top - target.top + origin.height / 2);
                    return [
                        [s, 0, 0],
                        [0, s, 0],
                        [dx, dy, 1]
                    ];
                }
            }
        }
    });
})(nx);
