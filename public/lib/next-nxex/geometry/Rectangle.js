(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class Rectangle
     * @namespace nxex.geometry
     */
    var EXPORT = nx.define("nxex.geometry.Rectangle", nx.Observable, {
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
            /**
             * 
             */
            calcRectZoomMatrix: function (target, origin) {
                // TODO 
                var s = (!origin.width && !origin.height) ? 1 : Math.min(target.height / Math.abs(origin.height), target.width / Math.abs(origin.width));
                var dx = (target.left + target.width / 2) - s * (origin.left + origin.width / 2);
                var dy = (target.top + target.height / 2) - s * (origin.top + origin.height / 2);
                return [
                    [s, 0, 0],
                    [0, s, 0],
                    [dx, dy, 1]
                ];
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
