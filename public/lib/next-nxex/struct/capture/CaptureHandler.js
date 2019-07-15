(function (nx, ui, toolkit, annotation, global) {
    /**
     * @class CaptureHandler
     * @namespace nxex.struct.capture
     */
    var EXPORT = nx.define("nxex.struct.capture.CaptureHandler", nx.Observable, {
        properties: {
            capture: {},
            dragstart: {},
            dragmove: {},
            dragend: {},
            dragcancel: {
            // TODO prepare for touch cancel event
            },
            release: {}
        },
        methods: {
            init: function (options) {
                this.inherited();
                this.sets(options);
                annotation.apply(this, "watcher,cascade");
            },
            offsetTooClose: nxex.struct.capture.CaptureManager.offsetTooClose,
            fixRect: nxex.struct.capture.CaptureManager.fixRect
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
