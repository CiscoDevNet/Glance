(function (nx) {
    var EXPORT = nx.define("sanvy.BufferColor", {
        properties: {
	    sanvy: null,
	    colors: function(){
		return new nx.List();
	    },
            buffer: {
                dependencies: "sanvy.context,colors",
                value: function (context, colors) {
                    if (context && colors) {
                        this.release("buffer");
                        var resources = new nx.Object();
                        var buffer = context.createBuffer();
                        resources.retain(colors.on("diff", function () {
                            // get plain array of the buffer
                            var data = colors.data().reduce(function (a, b) {
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
            init: function (sanvy, colors) {
                this.inherited();
		this.sanvy(sanvy);
		this.colors().pushAll(colors);
            },
            draw: function () {
                var context = this.sanvy().context();
		var buffer = this.buffer();
                context.bindBuffer(context.ARRAY_BUFFER, buffer);
                context.vertexAttribPointer(attribute, 4, gl.FLOAT, false, 0, 0);
            }
        }
    });
})(nx);
