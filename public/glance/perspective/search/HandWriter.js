(function(nx) {
    var EXPORT = nx.define("glance.perspective.search.HandWriter", nx.ui.Element, {
        view: {
            cssclass: "hand-writer",
            content: [{
                cssclass: "background",
                cssstyle: {
                    display: nx.binding("lines", function(v) {
                        return v ? "none" : "";
                    })
                },
                content: [{}, {
                    content: "Write here"
                }]
            }, {
                name: "graph",
                type: "nx.lib.svg.Svg",
                content: {
                    type: "nx.lib.svg.shape.Path",
                    properties: {
                        d: nx.binding("lines", function(lines) {
                            return nx.array.query({
                                array: lines || [],
                                mapping: function(line) {
                                    return "M" + line.map(function(point) {
                                        return point.join(" ");
                                    }).join("L");
                                }
                            }).join("");
                        })
                    }
                },
                events: {
                    "mousedown touchstart": function(sender, evt) {
                        // clear the timer
                        this.timer() && clearTimeout(this.timer());
                        // capture the drag events
                        evt.capture(this.graph(), ["drag", "dragend"]);
                    },
                    "capturedrag": function(sender, evt) {
                        // completed a line
                        var lines = this.lines();
                        lines || this.lines(lines = []);
                        // get or create the line
                        var line = this.line();
                        if (!line) {
                            line = [];
                            this.line(line);
                            lines.push(line);
                        }
                        // add point to line
                        var bound = this.getBound();
                        line.push([evt.capturedata.position[0] - bound.left, evt.capturedata.position[1] - bound.top]);
                        this.notify("lines");
                    },
                    "capturedragend": function(self, evt) {
                        if (this.line()) {
                            // clear the line
                            this.line(null);
                        }
                        if (this.lines()) {
                            this.timer(setTimeout(function() {
                                this.commit(this.lines());
                                this.lines(null);
                            }.bind(this), this.delay()));
                        }
                    }
                }
            }]
        },
        properties: {
            delay: 1000,
            timer: {},
            line: {},
            lines: {}
        },
        methods: {
            commit: function(lines) {
                var self = this;
                $.ajax({
                    method: "POST",
                    url: glance.service.api.getHandWriteUrl(),
                    contentType: "application/json",
                    data: JSON.stringify({
                        polygons: lines
                    }),
                    success: function(data) {
                        self.fire("input", {
                            text: data.text
                        });
                    },
                    error: function() {
                        self.fire("input", {
                            text: "K"
                        });
                    }
                });
            }
        },
        statics: {
            CSS: nx.util.csssheet.create({
                ".hand-writer": {
                    "position": "relative"
                },
                ".hand-writer .background": {
                    "position": "absolute",
                    "left": "0",
                    "right": "0",
                    "top": "0",
                    "bottom": "0",
                    "color": "#b3b3b3",
                    "display": "flex",
                    "flex-direction": "column",
                    "justify-content": "center",
                    "text-align": "center"
                },
                ".hand-writer > .background > div:first-child:before": {
                    "display": "block",
                    "content": "\\f0a6",
                    "font-family": "FontAwesome",
                    "font-size": "3em",
                    "transform": "rotate(-45deg)"
                },
                ".hand-writer svg": {
                    "position": "relative",
                    "width": "100%",
                    "height": "100%"
                },
                ".hand-writer path": {
                    "stroke": "black",
                    "stroke-width": ".2em",
                    "fill": "none"
                }
            })
        }
    });
})(nx);
