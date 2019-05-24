(function (nx, ui, toolkit, annotation, global) {
    var template = nxex.struct.Template.template, binding = nxex.struct.Binding.binding;
    var EXPORT = nx.define("nxex.common.Dialog", nxex.struct.Element, {
        struct: {
            properties: {
                class: "nxex-dialog",
                style: {
                    zIndex: binding("zIndex"),
                    display: binding("showing", function (showing) {
                        return !showing && "none";
                    })
                }
            },
            content: [{
                name: "mask"
            }, {
                name: "body"
            }]
        },
        properties: {
            zIndex: {
                value: "initial"
            },
            size: {
                value: function () {
                    return {
                        width: 0,
                        height: 0
                    };
                },
                cascade: {
                    source: "showing, body.childNodes",
                    update: function (showing) {
                        if (showing) {
                            this.defer(function () {
                                var bound = this.body().resolve("@root").getBound();
                                this.size({
                                    width: bound.width,
                                    height: bound.height
                                });
                            }.bind(this));
                        }
                    }
                }
            },
            showing: {
                cascade: {
                    source: "body.childNodes.count",
                    update: function (count) {
                        if (!count) {
                            this.showing(false);
                        }
                    }
                }
            },
            backgroundColorMask: {
                value: "rgba(0,0,0,.8)"
            },
            backgroundColor: {
                value: "white"
            }
        },
        methods: {
            defer: function (callback) {
                if (this._deferred) {
                    clearTimeout(this._deferred);
                }
                this.deferred = setTimeout(callback, 0);
            }
        },
        statics: {
            CSS: toolkit.css({
                ".nxex-dialog": {
                    "position": "fixed",
                    "left": "0px",
                    "top": "0px",
                    "right": "0px",
                    "bottom": "0px",
                    "color": "black"
                },
                ".nxex-dialog .nxex-dialog-mask": {
                    "position": "absolute",
                    "left": "0px",
                    "top": "0px",
                    "right": "0px",
                    "bottom": "0px"
                },
                ".nxex-dialog .nxex-dialog-body": {
                    "position": "absolute",
                    "left": "50%",
                    "top": "50%"
                }
            })
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
