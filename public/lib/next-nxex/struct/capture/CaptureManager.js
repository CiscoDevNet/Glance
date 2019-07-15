(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class CaptureManager
     * @namespace nxex.struct.capture
     */
    var EXPORT = nx.define("nxex.struct.capture.CaptureManager", nx.Observable, {
        properties: {
            mouseProcessor: {
                value: function () {
                    return new nxex.struct.capture.MouseProcessor();
                }
            },
            touchProcessor: {
                value: function () {
                    return new nxex.struct.capture.TouchProcessor();
                }
            }
        },
        methods: {
            enable: function (target) {
                // preprocess target
                if (!target) {
                    target = document;
                } else if (target.resolve) {
                    target = target.resolve("@root").$dom;
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
                rect = toolkit.clone(rect);
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

    // FIXME NeXT way?
    nx.dom.Document.ready(function () {
        (new EXPORT()).enable();
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
