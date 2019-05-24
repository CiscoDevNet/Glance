(function (nx) {
    var Matrix = nx.geometry.Matrix;
    var cssstyle = nx.util.cssstyle;
    var EXPORT = nx.define("nx.lib.component.SvgIcon", nx.ui.Element, {
        view: {
            cssclass: "nx-comp svg-icon",
            content: {
                type: "nx.ui.tag.Image",
                attributes: {
                    src: "{imgsrc}"
                }
            }
        },
        properties: {
            src: "",
            bgsrc: "",
            key: "",
            resize: null,
            fill: null,
            svg: {
                dependencies: "src",
                async: true,
                value: function (property, src) {
                    this.release("svg");
                    src && this.retain("svg", EXPORT.loadSvg(src, function (svg) {
                        property.set(svg);
                    }));
                }
            },
            bgsvg: {
                dependencies: "bgsrc",
                async: true,
                value: function (property, src) {
                    this.release("bgsvg");
                    src && this.retain("bgsvg", EXPORT.loadSvg(src, function (svg) {
                        property.set(svg);
                    }));
                }
            },
            imgsrc: {
                dependencies: "svg,bgsvg,key,resize,fill",
                value: function (svg, bgsvg, key, resize, fill) {
                    if (!svg) {
                        return "//:0";
                    }
                    if (!key) {
                        return nx.lib.svg.Svg.serialize(bgsvg || svg) || "//:0";
                    } else {
                        var dom = svg.querySelector("#" + key);
                        if (!dom) {
                            return "//:0";
                        }
                        var tmp, size, width, height, matrix;
                        size = EXPORT.getSvgSize(svg);
                        if (bgsvg) {
                            bgsvg = bgsvg.cloneNode(true);
                            resize = EXPORT.getSvgSize(bgsvg);
                        } else {
                            // create an SVG
                            bgsvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                            if (resize) {
                                bgsvg.setAttribute("width", resize.width + "px");
                                bgsvg.setAttribute("height", resize.height + "px");
                            } else {
                                bgsvg.setAttribute("width", size.width + "px");
                                bgsvg.setAttribute("height", size.height + "px");
                            }
                        }
                        // clone the target dom
                        dom = dom.cloneNode(true);
                        dom.removeAttribute("id");
                        EXPORT.cleanStyle(dom);
                        // check if resizing
                        if (resize && resize.width && resize.height) {
                            width = size.width, height = size.height;
                            if (width && height) {
                                scale = Math.min(resize.width / width, resize.height / height);
                                matrix = Array([scale, 0, 0], [0, scale, 0], [0, 0, 1]);
                                // wrap dom
                                tmp = document.createElementNS("http://www.w3.org/2000/svg", "g");
                                tmp.appendChild(dom);
                                dom = tmp;
                                cssstyle.set(dom, "transform", nx.util.cssstyle.toCssTransformMatrix(matrix));
                            }
                        }
                        // append to svg
                        cssstyle.set(dom, "fill", fill);
                        bgsvg.appendChild(dom);
                        // create image source
                        return nx.lib.svg.Svg.serialize(bgsvg);
                    }
                }
            }
        },
        statics: {
            cleanStyle: function (dom) {
                if (dom instanceof Element) {
                    dom.removeAttribute("class");
                    dom.removeAttribute("style");
                    var i, n = dom.childNodes.length;
                    for (i = 0; i < n; i++) {
                        EXPORT.cleanStyle(dom.childNodes[i]);
                    }
                }
            },
            loadSvg: function (url, callback) {
                return nx.util.ajax({
                    url: url,
                    success: function (resources, svg) {
                        if (typeof svg === "string") {
                            var temp = document.createElement("div");
                            temp.innerHTML = svg;
                            svg = temp.querySelector("svg");
                        } else if (!svg.tagName || svg.tagName.toLowerCase() !== "svg") {
                            svg = svg.querySelector("svg");
                        }
                        callback(svg);
                    }
                });
            },
            getSvgSize: function (svg) {
                var width = svg.getAttribute("width");
                var height = svg.getAttribute("height");
                var vb = svg.getAttribute("viewBox");
                if (width) {
                    width = width.replace(/[^-.0123456789]/g, "") * 1;
                }
                if (height) {
                    height = height.replace(/[^-.0123456789]/g, "") * 1;
                }
                if (vb) {
                    vb = vb.split(" ");
                    width = width || vb[2] * 1 || 0;
                    height = width || vb[3] * 1 || 0;
                }
                return {
                    width: width || 0,
                    height: height || 0
                };
            },
            CSS: nx.util.csssheet.create({
                ".nx-comp.svg-icon": {
                    "position": "relative"
                },
                ".nx-comp.svg-icon > img": {
                    "width": "100%",
                    "height": "100%",
                    "outline": "none",
                    "border": "0"
                },
                ".nx-comp.svg-icon:after": {
                    "content": " ",
                    "position": "absolute",
                    "background": "transparent",
                    "left": "0",
                    "top": "0",
                    "width": "100%",
                    "height": "100%"
                }
            })
        }
    });
})(nx);
