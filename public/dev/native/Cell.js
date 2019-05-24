(function (nx) {
    var EXPORT = nx.define("sanvy.Cell", {
        properties: {
            sanvy: null,
            buffer: null,
            matrices: {
                value: function () {
                    return new nx.List();
                }
            },
            program: {
                dependencies: "sanvy,texture,vertexBuffer,colorBuffer,indexBuffer,matrixUniforms.length",
                value: function (sanvy, texture, vertexBuffer, colorBuffer, indexBuffer, numMatrix) {
                    if (sanvy) {
                        var context = sanvy.context();
                    }
                }
            }
        },
        methods: {
            init: function (sanvy, data) {
                this.inherited();
                this.sanvy(sanvy);
                // TODO initialize
            },
            draw: function () {
                var context = this.context();
                var bufferIndex = this.bufferIndex();
                if (bufferIndex) {
                    context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, bufferIndex.buffer());
                    context.drawElements(context.TRIANGLES, bufferIndex.triangles().length(), gl.UNSIGNED_SHORT, 0);
                } else{
		    gl.drawArrays(gl.TRIANGLES, 0, );
		}
            }
        },
        statics: {
            GLSL_TEXTURE: {
                uniform: "uniform sampler2D uSampler;",
                varying: "varying vec2 vTextureCoord;",
                main: {
                    fragment: "gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));",
                    vertex: "vTextureCoord = {name}"
                }
            },
            GLSL_MATRIX: {
                uniform: "uniform mat4 uMatrix{index}"
            }
        }
    });
})(nx);
