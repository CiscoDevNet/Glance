(function (nx, ui, toolkit, annotation, global) {
    var template = nxex.struct.Template.template,
        binding = nxex.struct.Binding.binding;
    var EXPORT = nx.define("nxex.common.Popup", nxex.struct.Element, {
        struct: {
            properties: {
                class: "nxex-popup out-of-screen",
                style: {
                    zIndex: binding("zIndex"),
                    left: binding("position.x"),
                    top: binding("position.y"),
                    width: binding("size.width"),
                    height: binding("size.height")
                }
            },
            events: {
                webkitAnimationEnd: function (sender, evt) {
                    if (evt.animationName == "nxex-common-popup-animation-out") {
                        this.resolve("@root").addClass("out-of-screen");
                    }
                }
            },
            content: [{
                name: "background",
                type: "nxex.graph.Graph",
                properties: {
                    style: {
                        zIndex: binding("zIndex"),
                        left: binding("svgArgs.svgbound.x"),
                        top: binding("svgArgs.svgbound.y")
                    },
                    width: binding("svgArgs.svgbound.width"),
                    height: binding("svgArgs.svgbound.height")
                },
                content: [{
                    type: "nxex.graph.shape.Path",
                    properties: {
                        fill: binding("backgroundColor"),
                        d: binding("svgArgs.chain", function (chain) {
                            if (chain && chain.length > 2) {
                                var p = chain.shift();
                                var d = ["M", p[0], p[1]];
                                while (chain.length) {
                                    p = chain.shift();
                                    d.push("L", p[0], p[1]);
                                }
                                d.push("Z");
                                return d.join(" ");
                            } else {
                                return "M0,0";
                            }
                        })
                    }
                }]
            }, {
                name: "inner",
                properties: {
                    class: "nxex-popup-inner",
                    style: {
                        zIndex: binding("zIndex", function (idx) {
                            return idx + 1;
                        })
                    }
                }
            }]
        },
        properties: {
            zIndex: {
                value: "initial"
            },
            arrowAngleApproximate: {
                value: Math.PI / 2
            },
            arrowPosition: {
                value: null
            },
            position: {
                value: function () {
                    return {
                        x: 0,
                        y: 0
                    };
                }
            },
            keepWidth: {
                value: null
            },
            keepHeight: {
                value: null
            },
            size: {
                value: function () {
                    return {
                        width: 0,
                        height: 0
                    };
                },
                cascade: {
                    source: "showing, keepWidth, keepHeight, inner.childNodes",
                    update: function (showing, keepWidth, keepHeight, children, changepath) {
                        if (showing && (changepath == "showing" || changepath == "inner.childNodes") && (keepWidth || keepHeight)) {
                            this.defer(function () {
                                var size = this.size();
                                var bound = this.inner().resolve("@root").getBound();
                                this.size({
                                    width: keepWidth ? size.width : bound.width,
                                    height: keepHeight ? size.height : bound.height
                                });
                            }.bind(this));
                        }
                    }
                }
            },
            svgArgs: {
                cascade: {
                    source: "arrowPosition, arrowAngleApproximate, position, size",
                    output: function (apos, angle, pos, size) {
                        if (pos && size && size.width && size.height) {
                            var i, apos = {
                                    x: apos.x - pos.x,
                                    y: apos.y - pos.y
                                };
                            // get the bound of svg
                            var svgbound = {
                                x: Math.min(apos.x, 0),
                                y: Math.min(apos.y, 0),
                                width: Math.max(size.width, apos.x > 0 ? apos.x : size.width - apos.x) + 1,
                                height: Math.max(size.height, apos.y > 0 ? apos.y : size.height - apos.y) + 1
                            };
                            // create the bound vertices
                            var points;
                            points = [
                                [-svgbound.x, -svgbound.y],
                                [-svgbound.x + size.width, -svgbound.y],
                                [-svgbound.x + size.width, -svgbound.y + size.height],
                                [-svgbound.x, -svgbound.y + size.height],
                                [-svgbound.x, -svgbound.y]
                            ];
                            var seg, chain = [];
                            apos = [apos.x - svgbound.x, apos.y - svgbound.y];
                            for (i = 0; i < points.length - 1; i++) {
                                seg = EXPORT.getSeparatedSegment(apos, angle, [points[i], points[i + 1]]);
                                seg.pop();
                                chain = chain.concat(seg);
                            }
                            for (i = chain.length - 1; i >= 0; i--) {
                                if (nxex.geometry.Vector.equal(chain[i], chain[(i + 2) % chain.length])) {
                                    chain.splice(i + 1 >= chain.length ? i : 0, 1);
                                    chain.splice(i + 1 >= chain.length ? i : 0, 1);
                                }
                            }
                            return {
                                svgbound: svgbound,
                                chain: chain
                            };
                        }
                    }
                }
            },
            showing: {
                cascade: {
                    source: "inner.childNodes.count",
                    update: function (count) {
                        if (!count) {
                            this.showing(false);
                        }
                    }
                },
                watcher: function (pname, pvalue) {
                    if (pvalue) {
                        this.resolve("@root").removeClass("out-of-screen");
                        this.resolve("@root").removeClass("animation-out");
                    } else {
                        this.resolve("@root").addClass("animation-out");
                    }
                }
            },
            backgroundColor: {
                value: "rgba(0,0,0,.8)"
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
                ".nxex-popup": {
                    "display": "block",
                    "position": "fixed",
                    "color": "white",
                    "overflow": "visible"
                },
                ".nxex-popup.animation-out": {
                    "animation": toolkit.css.keyframes({
                        name: "nxex-common-popup-animation-out",
                        duration: ".5s",
                        definition: {
                            "0%": {
                                "opacity": "1"
                            },
                            "100%": {
                                "opacity": "0"
                            }
                        }
                    })
                },
                ".nxex-popup.out-of-screen": {
                    "left": "initial !important",
                    "top": "initial !important",
                    "bottom": "200% !important",
                    "right": "200% !important",
                    "width": "auto !important",
                    "height": "auto !important"
                },
                ".nxex-popup > svg": {
                    "position": "absolute"
                },
                ".nxex-popup:not(.out-of-screen):not(.animation-out)": {
                    "animation": toolkit.css.keyframes({
                        name: "nxex-common-popup-animation-in",
                        duration: ".5s",
                        definition: {
                            "0%": {
                                "opacity": "0"
                            },
                            "100%": {
                                "opacity": "1"
                            }
                        }
                    })
                },
                ".nxex-popup-inner": {
                    "position": "relative"
                }
            }),
            getSeparatedSegment: function (point, angle, segment) {
                // transform the point and segment to (0,0)-(1,0) perspect
                var matrix = EXPORT.getCellMatrix(segment[0], segment[1]);
                var ip = nxex.geometry.Vector.transform(point, matrix.getMatrixInversion());
                // make sure it's necessary to shadow
                if (ip[1] >= 0) {
                    return segment;
                }
                // shadow the sub-segment to x-axis
                var iw = Math.abs(ip[1] * Math.tan(angle / 2) * 2);
                var ia = ip[0] - iw / 2;
                var ib = ip[0] + iw / 2;
                var ips;
                if (ib - ia >= 1) {
                    ips = [
                        [0, 0], ip, [1, 0]
                    ];
                } else if (ia <= 0) {
                    ips = [
                        [0, 0], ip, [ib - ia, 0],
                        [1, 0]
                    ];
                } else if (ib >= 1) {
                    ips = [
                        [0, 0],
                        [ia + 1 - ib, 0], ip, [1, 0]
                    ];
                } else {
                    ips = [
                        [0, 0],
                        [ia, 0], ip, [ib, 0],
                        [1, 0]
                    ];
                }
                // transform back
                var ps = [];
                matrix = matrix.matrix();
                while (ips.length) {
                    ps.push(nxex.geometry.Vector.transform(ips.shift(), matrix));
                }
                return ps;
            },
            getCellMatrix: function (p0, p1) {
                var matrix = new nxex.geometry.Matrix(nxex.geometry.Matrix.I);
                var height = p1[1] - p0[1];
                var width = p1[0] - p0[0];
                matrix.applyRotate(Math.atan2(height, width));
                matrix.applyScale(Math.sqrt(height * height + width * width));
                matrix.applyTranslate(p0[0], p0[1]);
                return matrix;
            }
        }
    });
})(nx, nx.ui, nxex.toolkit, nxex.annotation, window);
