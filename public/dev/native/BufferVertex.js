(function (nx) {
    var EXPORT = nx.define("sanvy.BufferVertex", {
        properties: {
            sanvy: null,
            vertices: function () {
                return new nx.List();
            },
            buffer: {
                dependencies: "sanvy.context,vertices",
                value: function (context, vertices) {
                    if (context && vertices) {
                        this.release("buffer");
                        var resources = new nx.Object();
                        var buffer = context.createBuffer();
                        resources.retain(vertices.on("diff", function () {
                            // get plain array of the buffer
                            var data = vertices.data().reduce(function (a, b) {
                                return a.concat(b);
                            }, []);
                            context.bindBuffer(context.ARRAY_BUFFER, buffer);
                            context.bufferData(context.ARRAY_BUFFER, new Float32Array(data), context.STATIC_DRAW);
                        }));
                        resources.retain({
                            release: function () {
                                context.deleteBuffer(buffer);
                            }
                        });
                        this.retain("buffer", resources);
                        return buffer;
                    }
                }
            }
        },
        methods: {
            init: function (sanvy, vertices) {
                this.inherited();
                this.sanvy(sanvy);
                this.vertices.pushAll(vertices);
            },
            draw: function (attribute) {
                var context = this.sanvy().context();
		var buffer = this.buffer();
                context.bindBuffer(context.ARRAY_BUFFER, buffer);
                context.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 0, 0);
            }
        }
    });
})(nx);
