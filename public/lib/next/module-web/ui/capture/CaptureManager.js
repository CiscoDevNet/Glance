(function (nx) {
    /**
     * @class CaptureManager
     * @namespace nx.ui.capture
     */
    var EXPORT = nx.define("nx.ui.capture.CaptureManager", {
        properties: {
            mouseProcessor: {
                value: function () {
                    return new nx.ui.capture.MouseProcessor();
                }
            },
            touchProcessor: {
                value: function () {
                    return new nx.ui.capture.TouchProcessor();
                }
            }
        },
        methods: {
            enable: function (target) {
                // preprocess target
                if (!target) {
                    target = document;
                } else if (target.resolve) {
                    target = target._dom;
                }
                // enable mouse and touch input capture processors
                this.mouseProcessor().enable(target);
                this.touchProcessor().enable(target);
            }
        },
        statics: {
            offsetTooClose: function (offset) {
                return Math.abs(offset[0]) < 5 && Math.abs(offset[1]) < 5;
            },
            fixRect: function (rect) {
                if (!rect) {
                    return rect;
                }
                rect = nx.clone(rect);
                if (rect.width < 0) {
                    rect.left += rect.width;
                    rect.width = -rect.width;
                }
                if (rect.height < 0) {
                    rect.top += rect.height;
                    rect.height = -rect.height;
                }
                return rect;
            }
        }
    });

    nx.ready(function () {
        var instance = new EXPORT();
        instance.enable();
    });
})(nx);
